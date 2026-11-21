<?php

use App\Models\ClinicQueue;
use App\Models\Endorsed;
use App\Models\MedicalCertificate;
use App\Models\User;

// Preview/print is read-only: it generates the document from data already
// fetched and must never release a request or complete the visit. Only an
// explicit Confirm & Release PUT may remove it from the pending list.

function printReleaseDoctor(): User
{
    return User::factory()->create(['role' => 'doctor']);
}

function printReleaseRequest(User $doctor): MedicalCertificate
{
    static $n = 5000;

    $patient = User::factory()->create(['role' => 'patient']);
    $queue = ClinicQueue::create([
        'patient_id' => $patient->user_id,
        'visit_type' => 'medcert',
        'status' => 'with-doctor',
        'triaged' => false,
        'endorsed' => true,
        'queue_number' => ++$n,
        'date' => now()->toDateString(),
        'time_in' => '9:00 AM',
    ]);

    Endorsed::create([
        'queue_id' => $queue->queue_id,
        'doctor_id' => $doctor->user_id,
        'diagnosis' => 'Common cold',
        'status' => 'pending',
    ]);

    return MedicalCertificate::create([
        'queue_id' => $queue->queue_id,
        'diagnosis_reason' => 'For employment',
    ]);
}

function printReleasePendingIds($test, User $doctor): array
{
    return collect($test->actingAs($doctor)->getJson('/api/v1/medical-certificates?released=0&endorsed=1')->assertOk()->json())
        ->pluck('certificate_id')
        ->all();
}

it('keeps a printed request pending and does not complete the visit', function () {
    $doctor = printReleaseDoctor();
    $cert = printReleaseRequest($doctor);

    // Preview/print reads the certificate through the normal list endpoint.
    expect(printReleasePendingIds($this, $doctor))->toContain($cert->certificate_id);
    expect($cert->fresh()->is_released)->toBeFalse();

    // Saving the blank fields so they can be printed is still not a release.
    $this->actingAs($doctor)
        ->putJson("/api/v1/medical-certificates/{$cert->certificate_id}", [
            'findings' => 'Upper respiratory tract infection',
            'license_no' => '0123456',
            'is_released' => false,
        ])
        ->assertOk();

    expect(printReleasePendingIds($this, $doctor))->toContain($cert->certificate_id);

    $cert->refresh();
    expect($cert->is_released)->toBeFalse();
    expect($cert->issued_by)->toBeNull();

    $history = $this->actingAs($doctor)
        ->getJson('/api/v1/queues?completed=1&assigned_to_me=1')
        ->assertOk()
        ->json();

    expect(collect($history)->pluck('queue_id')->all())->not->toContain($cert->queue_id);
});

it('only removes the request after an explicit confirm release', function () {
    $doctor = printReleaseDoctor();
    $cert = printReleaseRequest($doctor);

    $this->actingAs($doctor)
        ->putJson("/api/v1/medical-certificates/{$cert->certificate_id}", [
            'findings' => 'Upper respiratory tract infection',
            'license_no' => '0123456',
            'is_released' => true,
        ])
        ->assertOk();

    expect(printReleasePendingIds($this, $doctor))->not->toContain($cert->certificate_id);

    $cert->refresh();
    expect($cert->is_released)->toBeTrue();
    expect($cert->issued_by)->toBe($doctor->user_id);
});
