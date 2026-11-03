<?php

use App\Models\ClinicQueue;
use App\Models\Endorsed;
use App\Models\LabRequest;
use App\Models\MedicalCertificate;
use App\Models\Prescription;
use App\Models\TriageRecord;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

// Role-based access to the clinical records (policies wired into the controllers).

function accessUser(string $role, array $attrs = []): User
{
    return User::factory()->create(array_merge(['role' => $role], $attrs));
}

function accessVisit(User $patient, array $attrs = []): ClinicQueue
{
    static $n = 0;

    return ClinicQueue::create(array_merge([
        'patient_id' => $patient->user_id,
        'visit_type' => 'consult',
        'status' => 'waiting',
        'triaged' => false,
        'endorsed' => false,
        'queue_number' => ++$n,
        'date' => now()->toDateString(),
        'time_in' => '9:00 AM',
    ], $attrs));
}

function accessEndorsement(ClinicQueue $queue, User $doctor): Endorsed
{
    return Endorsed::create([
        'queue_id' => $queue->queue_id,
        'doctor_id' => $doctor->user_id,
        'diagnosis' => 'Common cold',
        'status' => 'pending',
    ]);
}

it('resolves a real policy for every clinical model', function () {
    foreach ([
        ClinicQueue::class => App\Policies\ClinicQueuePolicy::class,
        Endorsed::class => App\Policies\EndorsedPolicy::class,
        Prescription::class => App\Policies\PrescriptionPolicy::class,
        LabRequest::class => App\Policies\LabRequestPolicy::class,
        MedicalCertificate::class => App\Policies\MedicalCertificatePolicy::class,
        TriageRecord::class => App\Policies\TriageRecordPolicy::class,
    ] as $model => $policy) {
        expect(Gate::getPolicyFor($model))->toBeInstanceOf($policy);
    }
});

it('keeps patients out of the clinical record APIs', function () {
    $patient = accessUser('patient');

    $this->actingAs($patient);

    $this->getJson('/api/v1/lab-requests')->assertForbidden();
    $this->getJson('/api/v1/medicine-issuances')->assertForbidden();
    $this->postJson('/api/v1/prescriptions', [])->assertForbidden();
    $this->postJson('/api/v1/triage', ['queue_id' => accessVisit($patient)->queue_id])->assertForbidden();
});

it('lets the doctor use lab requests and blocks the nurse from writing them', function () {
    $this->actingAs(accessUser('doctor'))->getJson('/api/v1/lab-requests')->assertOk();

    $this->actingAs(accessUser('nurse'))->postJson('/api/v1/prescriptions', [])->assertForbidden();
    $this->actingAs(accessUser('nurse'))->postJson('/api/v1/lab-requests', [])->assertForbidden();
});

it('lets the nurse read and log medicine issuances', function () {
    $this->actingAs(accessUser('nurse'))->getJson('/api/v1/medicine-issuances')->assertOk();
    $this->actingAs(accessUser('doctor'))->postJson('/api/v1/medicine-issuances', [])->assertForbidden();
});

it('only lets the assigned doctor update an endorsement', function () {
    $doctor = accessUser('doctor');
    $other = accessUser('doctor');
    $endorsed = accessEndorsement(accessVisit(accessUser('patient')), $doctor);

    $this->actingAs($other)
        ->putJson("/api/v1/endorsed/{$endorsed->endorsed_id}", ['diagnosis' => 'Changed'])
        ->assertForbidden();

    $this->actingAs($doctor)
        ->putJson("/api/v1/endorsed/{$endorsed->endorsed_id}", ['diagnosis' => 'Acute rhinitis'])
        ->assertOk();

    expect($endorsed->fresh()->diagnosis)->toBe('Acute rhinitis');
});

it('does not show other patients records in the patient queue overview', function () {
    $me = accessUser('patient');
    $someoneElse = accessUser('patient', ['firstname' => 'Secretive', 'lastname' => 'Person']);
    accessVisit($someoneElse);
    $mine = accessVisit($me);

    $response = $this->actingAs($me)->getJson('/api/v1/queues')->assertOk();

    foreach ($response->json() as $row) {
        expect(array_keys($row))->toEqualCanonicalizing(['queue_number', 'status']);
    }
    expect($response->getContent())->not->toContain('Secretive');

    // "mine" still returns the full own entry.
    $own = $this->actingAs($me)->getJson('/api/v1/queues?mine=1')->assertOk()->json();
    expect(collect($own)->pluck('queue_id')->all())->toBe([$mine->queue_id]);
});

it('lets only an admin delete a queue entry', function () {
    $patient = accessUser('patient');
    $entry = accessVisit($patient);

    $this->actingAs($patient)->deleteJson("/api/v1/queues/{$entry->queue_id}")->assertForbidden();
    $this->actingAs(accessUser('nurse'))->deleteJson("/api/v1/queues/{$entry->queue_id}")->assertForbidden();
    $this->actingAs(accessUser('admin'))->deleteJson("/api/v1/queues/{$entry->queue_id}")->assertOk();
});

it('lets the doctor mark a visit examined', function () {
    $entry = accessVisit(accessUser('patient'), ['status' => 'with-doctor']);

    $this->actingAs(accessUser('doctor'))
        ->putJson("/api/v1/queues/{$entry->queue_id}", ['status' => 'examined'])
        ->assertOk();

    expect($entry->fresh()->status)->toBe('examined');
});

it('stops a patient from viewing or changing somebody else\'s visit', function () {
    $other = accessVisit(accessUser('patient'));
    $patient = accessUser('patient');

    $this->actingAs($patient)->getJson("/api/v1/queues/{$other->queue_id}")->assertForbidden();
    $this->actingAs($patient)->putJson("/api/v1/queues/{$other->queue_id}", ['status' => 'done'])->assertForbidden();
});

it('lets only nurses and admins endorse a patient', function () {
    $entry = accessVisit(accessUser('patient'));
    $doctor = accessUser('doctor');

    $this->actingAs(accessUser('patient'))->getJson('/api/v1/doctors')->assertForbidden();
    $this->actingAs(accessUser('patient'))
        ->postJson("/api/v1/queues/{$entry->queue_id}/endorse", ['doctor_id' => $doctor->user_id])
        ->assertForbidden();

    $this->actingAs($nurse = accessUser('nurse'))->getJson('/api/v1/doctors')->assertOk();
    $this->actingAs($nurse)
        ->postJson("/api/v1/queues/{$entry->queue_id}/endorse", ['doctor_id' => $doctor->user_id])
        ->assertOk();

    expect($entry->fresh()->status)->toBe('with-doctor');
});

it('lets a patient request a medical certificate for their own visit only, never self-issued', function () {
    $patient = accessUser('patient');
    $mine = accessVisit($patient, ['visit_type' => 'medcert']);
    $theirs = accessVisit(accessUser('patient'), ['visit_type' => 'medcert']);

    $this->actingAs($patient)->postJson('/api/v1/medical-certificates', [
        'queue_id' => $theirs->queue_id,
        'diagnosis_reason' => 'Fever',
    ])->assertForbidden();

    $this->actingAs($patient)->postJson('/api/v1/medical-certificates', [
        'diagnosis_reason' => 'Fever',
    ])->assertForbidden();

    $this->actingAs($patient)->postJson('/api/v1/medical-certificates', [
        'queue_id' => $mine->queue_id,
        'diagnosis_reason' => 'Fever',
        'is_released' => true,          // must be ignored for a patient
        'issued_by' => accessUser('doctor')->user_id,
        'findings' => 'Self-written findings',
    ])->assertCreated();

    $cert = MedicalCertificate::where('queue_id', $mine->queue_id)->first();
    expect($cert)->not->toBeNull()
        ->and((bool) $cert->is_released)->toBeFalse()
        ->and($cert->issued_by)->toBeNull()
        ->and($cert->findings)->toBeNull();
});

it('only returns a patient their own medical certificates', function () {
    $patient = accessUser('patient');
    $mine = accessVisit($patient);
    $theirs = accessVisit(accessUser('patient'));

    MedicalCertificate::create(['queue_id' => $mine->queue_id, 'diagnosis_reason' => 'Mine']);
    MedicalCertificate::create(['queue_id' => $theirs->queue_id, 'diagnosis_reason' => 'Not mine']);

    $rows = $this->actingAs($patient)->getJson('/api/v1/medical-certificates')->assertOk()->json();

    expect(collect($rows)->pluck('diagnosis_reason')->all())->toBe(['Mine']);
});

it('lets only doctors and admins edit a medical certificate', function () {
    $cert = MedicalCertificate::create([
        'queue_id' => accessVisit(accessUser('patient'))->queue_id,
        'diagnosis_reason' => 'Fever',
    ]);

    $this->actingAs(accessUser('nurse'))
        ->putJson("/api/v1/medical-certificates/{$cert->certificate_id}", ['findings' => 'x'])
        ->assertForbidden();

    $this->actingAs(accessUser('doctor'))
        ->putJson("/api/v1/medical-certificates/{$cert->certificate_id}", ['findings' => 'Rest advised'])
        ->assertOk();
});

it('blocks patients from the web record pages', function () {
    $this->actingAs(accessUser('patient'));

    foreach (['/endorsed', '/prescriptions', '/lab-requests', '/medicine-issuances', '/triage-records', '/consultations'] as $url) {
        $this->get($url)->assertForbidden();
    }
});
