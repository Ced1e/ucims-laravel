<?php

use App\Models\RecordDeletionRequest;
use App\Models\User;

// Needs the two routes from CLAUDE3_NURSE_README.txt (routes snippet) to be merged into routes/web.php.
// The factory password for every user is 'Password123!'.

function deletionPayload(User $patient, array $overrides = []): array
{
    return array_merge([
        'patient_id' => $patient->user_id,
        'reason' => 'Duplicate record created by mistake.',
        'password' => 'Password123!',
    ], $overrides);
}

test('a nurse can log a deletion request and nothing is deleted', function () {
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-801']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-801']);

    $this->actingAs($nurse)
        ->postJson('/api/records/deletion-requests', deletionPayload($patient))
        ->assertCreated();

    $this->assertDatabaseHas('record_deletion_requests', [
        'patient_id' => $patient->user_id,
        'requested_by' => $nurse->user_id,
        'status' => 'pending',
    ]);
    $this->assertDatabaseHas('users', ['user_id' => $patient->user_id]);
});

test('a wrong password or a short reason is rejected', function () {
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-802']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-802']);

    $this->actingAs($nurse)
        ->postJson('/api/records/deletion-requests', deletionPayload($patient, ['password' => 'wrong-password']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('password');

    $this->actingAs($nurse)
        ->postJson('/api/records/deletion-requests', deletionPayload($patient, ['reason' => 'short']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('reason');

    expect(RecordDeletionRequest::count())->toBe(0);
});

test('only clinic staff can submit, patients and guests cannot', function () {
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-803']);
    $other = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-804']);

    $this->postJson('/api/records/deletion-requests', deletionPayload($other))->assertUnauthorized();

    $this->actingAs($patient)
        ->postJson('/api/records/deletion-requests', deletionPayload($other))
        ->assertForbidden();

    expect(RecordDeletionRequest::count())->toBe(0);
});

test('a second pending request for the same patient is refused', function () {
    $doctor = User::factory()->create(['role' => 'doctor', 'clinic_id' => 'D-801']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-805']);

    $this->actingAs($doctor)->postJson('/api/records/deletion-requests', deletionPayload($patient))->assertCreated();
    $this->actingAs($doctor)->postJson('/api/records/deletion-requests', deletionPayload($patient))->assertUnprocessable();

    expect(RecordDeletionRequest::count())->toBe(1);
});

test('staff only see their own requests while an admin sees all of them', function () {
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-803']);
    $doctor = User::factory()->create(['role' => 'doctor', 'clinic_id' => 'D-802']);
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-801']);
    $p1 = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-806']);
    $p2 = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-807']);

    $this->actingAs($nurse)->postJson('/api/records/deletion-requests', deletionPayload($p1))->assertCreated();
    $this->actingAs($doctor)->postJson('/api/records/deletion-requests', deletionPayload($p2))->assertCreated();

    $this->actingAs($nurse)->getJson('/api/records/deletion-requests')
        ->assertOk()->assertJsonCount(1, 'requests');

    $this->actingAs($admin)->getJson('/api/records/deletion-requests')
        ->assertOk()->assertJsonCount(2, 'requests');
});
