<?php

use App\Models\RecordDeletionRequest;
use App\Models\User;

/** Backdate an account's creation date, the value the five-year rule reads. */
function backdateAccount(User $user, int $years, int $months = 0, int $days = 0): User
{
    $user->created_at = now()->subYears($years)->subMonths($months)->subDays($days);
    $user->save();

    return $user->refresh();
}

function makeDeletionRequest(User $nurse, User $patient, array $overrides = []): RecordDeletionRequest
{
    return RecordDeletionRequest::create(array_merge([
        'patient_id' => $patient->user_id,
        'patient_clinic_id' => $patient->clinic_id,
        'patient_name' => trim($patient->firstname.' '.$patient->lastname),
        'requested_by' => $nurse->user_id,
        'reason' => 'Duplicate record created by mistake.',
        'status' => 'pending',
    ], $overrides));
}

test('the aging list only contains accounts five years or older with their ages', function () {
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-951']);
    $oldPatient = backdateAccount(User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-951']), 6, 2, 3);
    $oldNurse = backdateAccount(User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-951']), 5);
    $young = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-952']);

    $response = $this->actingAs($admin)->getJson('/api/records/old-accounts')->assertOk();

    $accounts = collect($response->json('accounts'));
    expect($accounts->pluck('id')->all())->toHaveCount(2);
    expect($accounts->pluck('id'))->toContain($oldPatient->user_id, $oldNurse->user_id);
    expect($accounts->pluck('id'))->not->toContain($young->user_id);

    $row = $accounts->firstWhere('id', $oldPatient->user_id);
    expect($row['kind'])->toBe('patient');
    expect($row['age_years'])->toBe(6);
    expect($row['age_months'])->toBe(2);
    expect($row['age_days'])->toBe(3);
    expect($row['age_total_days'])->toBeGreaterThan(2000);
    expect($row['age_label'])->toBe('6 yrs, 2 mos, 3 days');
});

test('only the admin can view aging accounts or delete them in batches', function () {
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-952']);
    $old = backdateAccount(User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-953']), 7);

    $this->actingAs($nurse)->getJson('/api/records/old-accounts')->assertForbidden();

    $this->actingAs($nurse)
        ->postJson('/api/records/accounts/batch-delete', [
            'accounts' => [['kind' => 'patient', 'id' => $old->user_id]],
        ])
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['user_id' => $old->user_id]);
});

test('a batch delete removes eligible accounts and skips young or mismatched rows', function () {
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-953']);
    $oldPatient = backdateAccount(User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-954']), 8);
    $oldNurse = backdateAccount(User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-953']), 6);
    $youngPatient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-955']);

    $response = $this->actingAs($admin)
        ->postJson('/api/records/accounts/batch-delete', [
            'accounts' => [
                ['kind' => 'patient', 'id' => $oldPatient->user_id],
                ['kind' => 'staff', 'id' => $oldNurse->user_id],
                ['kind' => 'patient', 'id' => $youngPatient->user_id],
                ['kind' => 'staff', 'id' => $admin->user_id],
            ],
        ])
        ->assertOk()
        ->assertJson(['status' => 'success', 'deleted' => 2]);

    expect($response->json('skipped'))->toHaveCount(2);

    $this->assertDatabaseMissing('users', ['user_id' => $oldPatient->user_id]);
    $this->assertDatabaseMissing('users', ['user_id' => $oldNurse->user_id]);
    $this->assertDatabaseHas('users', ['user_id' => $youngPatient->user_id]);
    $this->assertDatabaseHas('users', ['user_id' => $admin->user_id]);
});

test('approving a deletion request deletes the patient and closes the request', function () {
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-954']);
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-954']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-956']);
    $request = makeDeletionRequest($nurse, $patient);

    $this->actingAs($admin)
        ->postJson("/api/records/deletion-requests/{$request->request_id}/approve", ['notes' => 'Verified duplicate.'])
        ->assertOk()
        ->assertJson(['status' => 'success']);

    $this->assertDatabaseMissing('users', ['user_id' => $patient->user_id]);
    $this->assertDatabaseHas('record_deletion_requests', [
        'request_id' => $request->request_id,
        'status' => 'approved',
        'reviewed_by' => $admin->user_id,
        'patient_id' => null,
        'review_notes' => 'Verified duplicate.',
    ]);
});

test('rejecting a deletion request keeps the patient record', function () {
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-955']);
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-955']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-957']);
    $request = makeDeletionRequest($nurse, $patient);

    $this->actingAs($admin)
        ->postJson("/api/records/deletion-requests/{$request->request_id}/reject", ['notes' => 'Still an active patient.'])
        ->assertOk()
        ->assertJson(['status' => 'success']);

    $this->assertDatabaseHas('users', ['user_id' => $patient->user_id]);
    $this->assertDatabaseHas('record_deletion_requests', [
        'request_id' => $request->request_id,
        'status' => 'rejected',
        'reviewed_by' => $admin->user_id,
        'review_notes' => 'Still an active patient.',
    ]);
});

test('a deletion request cannot be reviewed twice', function () {
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-956']);
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-956']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-958']);
    $request = makeDeletionRequest($nurse, $patient, ['status' => 'approved']);

    $this->actingAs($admin)
        ->postJson("/api/records/deletion-requests/{$request->request_id}/approve")
        ->assertUnprocessable();

    $this->actingAs($admin)
        ->postJson("/api/records/deletion-requests/{$request->request_id}/reject")
        ->assertUnprocessable();

    $this->assertDatabaseHas('users', ['user_id' => $patient->user_id]);
});

test('nurses cannot approve or reject deletion requests', function () {
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-957']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-959']);
    $request = makeDeletionRequest($nurse, $patient);

    $this->actingAs($nurse)
        ->postJson("/api/records/deletion-requests/{$request->request_id}/approve")
        ->assertForbidden();

    $this->actingAs($nurse)
        ->postJson("/api/records/deletion-requests/{$request->request_id}/reject")
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['user_id' => $patient->user_id]);
    $this->assertDatabaseHas('record_deletion_requests', [
        'request_id' => $request->request_id,
        'status' => 'pending',
    ]);
});
