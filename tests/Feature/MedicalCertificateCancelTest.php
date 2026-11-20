<?php

use App\Models\ClinicQueue;
use App\Models\Endorsed;
use App\Models\MedicalCertificate;
use App\Models\User;

// Confirm removes a request from pending and records it in history; cancel removes
// it from pending only, so a cancelled request can never be released or appear in
// the doctor's history.

function cancelTestDoctor(): User
{
    return User::factory()->create(['role' => 'doctor']);
}

function cancelTestRequest(User $doctor): MedicalCertificate
{
    static $n = 4000;

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

it('removes a cancelled request from the pending list without releasing it', function () {
    $doctor = cancelTestDoctor();
    $cert = cancelTestRequest($doctor);

    $this->actingAs($doctor)
        ->postJson("/api/v1/medical-certificates/{$cert->certificate_id}/cancel")
        ->assertOk()
        ->assertJson(['status' => 'success']);

    $pending = $this->actingAs($doctor)
        ->getJson('/api/v1/medical-certificates?released=0&endorsed=1')
        ->assertOk()
        ->json();

    expect(collect($pending)->pluck('certificate_id')->all())->not->toContain($cert->certificate_id);

    $cert->refresh();
    expect($cert->is_released)->toBeFalse();
    expect($cert->cancelled_at)->not->toBeNull();

    // Nothing was completed, so the visit is not part of examination history.
    $history = $this->actingAs($doctor)
        ->getJson('/api/v1/queues?completed=1&assigned_to_me=1')
        ->assertOk()
        ->json();

    expect(collect($history)->pluck('queue_id')->all())->not->toContain($cert->queue_id);
});

it('refuses to release a cancelled request', function () {
    $doctor = cancelTestDoctor();
    $cert = cancelTestRequest($doctor);

    $this->actingAs($doctor)->postJson("/api/v1/medical-certificates/{$cert->certificate_id}/cancel")->assertOk();

    $this->actingAs($doctor)
        ->putJson("/api/v1/medical-certificates/{$cert->certificate_id}", [
            'findings' => 'Upper respiratory tract infection',
            'license_no' => '0123456',
            'is_released' => true,
        ])
        ->assertStatus(422);

    expect($cert->fresh()->is_released)->toBeFalse();
});

it('keeps a confirmed request out of pending and in history', function () {
    $doctor = cancelTestDoctor();
    $cert = cancelTestRequest($doctor);

    $this->actingAs($doctor)
        ->putJson("/api/v1/medical-certificates/{$cert->certificate_id}", [
            'findings' => 'Upper respiratory tract infection',
            'license_no' => '0123456',
            'is_released' => true,
        ])
        ->assertOk();

    $this->actingAs($doctor)
        ->putJson("/api/v1/queues/{$cert->queue_id}", ['status' => 'done', 'time_out' => '10:00 AM'])
        ->assertOk();

    $pending = $this->actingAs($doctor)
        ->getJson('/api/v1/medical-certificates?released=0&endorsed=1')
        ->assertOk()
        ->json();

    expect(collect($pending)->pluck('certificate_id')->all())->not->toContain($cert->certificate_id);
    expect($cert->fresh()->is_released)->toBeTrue();

    $history = $this->actingAs($doctor)
        ->getJson('/api/v1/queues?completed=1&assigned_to_me=1')
        ->assertOk()
        ->json();

    expect(collect($history)->pluck('queue_id')->all())->toContain($cert->queue_id);
});

it('blocks nurses from cancelling and blocks cancelling a released request', function () {
    $doctor = cancelTestDoctor();
    $nurse = User::factory()->create(['role' => 'nurse']);

    $cert = cancelTestRequest($doctor);

    $this->actingAs($nurse)
        ->postJson("/api/v1/medical-certificates/{$cert->certificate_id}/cancel")
        ->assertForbidden();

    expect($cert->fresh()->cancelled_at)->toBeNull();

    $cert->update(['is_released' => true]);

    $this->actingAs($doctor)
        ->postJson("/api/v1/medical-certificates/{$cert->certificate_id}/cancel")
        ->assertStatus(422);
});
