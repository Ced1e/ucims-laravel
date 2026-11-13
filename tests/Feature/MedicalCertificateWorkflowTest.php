<?php

use App\Models\ClinicQueue;
use App\Models\Endorsed;
use App\Models\MedicalCertificate;
use App\Models\User;

// MedCerts must go through the nurse endorsement before the doctor sees them,
// and the doctor must be able to look illnesses up by name or ICD-10 code.

function workflowPatient(): User
{
    return User::factory()->create(['role' => 'patient']);
}

function workflowVisit(User $patient, bool $endorsed = false): ClinicQueue
{
    static $n = 2000;

    return ClinicQueue::create([
        'patient_id' => $patient->user_id,
        'visit_type' => 'medcert',
        'status' => $endorsed ? 'with-doctor' : 'waiting',
        'triaged' => false,
        'endorsed' => $endorsed,
        'queue_number' => ++$n,
        'date' => now()->toDateString(),
        'time_in' => '9:00 AM',
    ]);
}

it('hides medical certificate requests from doctors until the patient is endorsed', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);
    $nurse = User::factory()->create(['role' => 'nurse']);

    $pendingQueue = workflowVisit(workflowPatient());
    $pendingCert = MedicalCertificate::create([
        'queue_id' => $pendingQueue->queue_id,
        'diagnosis_reason' => 'For employment',
    ]);

    $endorsedQueue = workflowVisit(workflowPatient(), endorsed: true);
    Endorsed::create([
        'queue_id' => $endorsedQueue->queue_id,
        'doctor_id' => $doctor->user_id,
        'diagnosis' => 'Common cold',
        'status' => 'pending',
    ]);
    $endorsedCert = MedicalCertificate::create([
        'queue_id' => $endorsedQueue->queue_id,
        'diagnosis_reason' => 'For scholarship',
    ]);

    $doctorList = $this->actingAs($doctor)
        ->getJson('/api/v1/medical-certificates?released=0&endorsed=1')
        ->assertOk()
        ->json();

    expect(collect($doctorList)->pluck('certificate_id')->all())->toBe([$endorsedCert->certificate_id]);

    // The rule holds even if the doctor's client forgets the filter.
    $doctorDefault = $this->actingAs($doctor)
        ->getJson('/api/v1/medical-certificates?released=0')
        ->assertOk()
        ->json();

    expect(collect($doctorDefault)->pluck('certificate_id')->all())->toBe([$endorsedCert->certificate_id]);

    // The nurse station still sees every pending request so it can endorse.
    $nurseList = $this->actingAs($nurse)
        ->getJson('/api/v1/medical-certificates?released=0')
        ->assertOk()
        ->json();

    expect(collect($nurseList)->pluck('certificate_id')->sort()->values()->all())
        ->toBe(collect([$pendingCert->certificate_id, $endorsedCert->certificate_id])->sort()->values()->all());

    // Once the pending visit is endorsed it reaches the doctor's list too.
    $pendingQueue->update(['endorsed' => true, 'status' => 'with-doctor']);
    Endorsed::create([
        'queue_id' => $pendingQueue->queue_id,
        'doctor_id' => $doctor->user_id,
        'diagnosis' => 'Gastritis',
        'status' => 'pending',
    ]);

    $afterEndorsement = $this->actingAs($doctor)
        ->getJson('/api/v1/medical-certificates?released=0&endorsed=1')
        ->assertOk()
        ->json();

    expect(collect($afterEndorsement)->pluck('certificate_id')->sort()->values()->all())
        ->toBe(collect([$pendingCert->certificate_id, $endorsedCert->certificate_id])->sort()->values()->all());
});

it('searches the ICD-10 catalogue by disease name', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);

    $rows = $this->actingAs($doctor)
        ->getJson('/api/v1/icd10?q=upper respiratory&by=word')
        ->assertOk()
        ->json();

    expect($rows)->not->toBeEmpty()
        ->and($rows[0]['code'])->toBe('J06.9')
        ->and($rows[0]['name'])->toContain('upper respiratory');
});

it('searches the ICD-10 catalogue by code', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);

    $rows = $this->actingAs($doctor)
        ->getJson('/api/v1/icd10?q=J06&by=code')
        ->assertOk()
        ->json();

    expect(collect($rows)->pluck('code')->all())->toContain('J06.9');

    $exact = $this->actingAs($doctor)
        ->getJson('/api/v1/icd10?q=j069&by=code')
        ->assertOk()
        ->json();

    expect($exact[0]['code'])->toBe('J06.9');
});

it('returns an empty list for a blank or unmatched search', function () {
    $nurse = User::factory()->create(['role' => 'nurse']);

    expect($this->actingAs($nurse)->getJson('/api/v1/icd10?q=')->assertOk()->json())->toBe([]);
    expect($this->actingAs($nurse)->getJson('/api/v1/icd10?q=zzzznotanillness&by=word')->assertOk()->json())->toBe([]);
});

it('keeps patients out of the ICD-10 lookup', function () {
    $this->actingAs(workflowPatient())
        ->getJson('/api/v1/icd10?q=cough&by=word')
        ->assertForbidden();
});
