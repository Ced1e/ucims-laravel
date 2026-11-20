<?php

use App\Models\PprPermanent;
use App\Models\User;

test('an admin can delete a staff account', function () {
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-901']);
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-901']);

    $this->actingAs($admin)
        ->deleteJson("/api/records/staff/{$nurse->user_id}")
        ->assertOk()
        ->assertJson(['status' => 'success']);

    $this->assertDatabaseMissing('users', ['user_id' => $nurse->user_id]);
});

test('an admin can delete a patient account and its clinic profile', function () {
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-902']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-901']);
    PprPermanent::create(['patient_id' => $patient->user_id, 'patient_type' => 'Student']);

    $this->actingAs($admin)
        ->deleteJson("/api/records/patients/{$patient->user_id}")
        ->assertOk()
        ->assertJson(['status' => 'success']);

    $this->assertDatabaseMissing('users', ['user_id' => $patient->user_id]);
    $this->assertDatabaseMissing('ppr_permanent', ['patient_id' => $patient->user_id]);
});

test('an admin cannot delete their own account', function () {
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-903']);

    $this->actingAs($admin)
        ->deleteJson("/api/records/staff/{$admin->user_id}")
        ->assertUnprocessable();

    $this->assertDatabaseHas('users', ['user_id' => $admin->user_id]);
});

test('only admins can delete accounts', function () {
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-902']);
    $otherNurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-903']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-902']);

    $this->actingAs($nurse)
        ->deleteJson("/api/records/staff/{$otherNurse->user_id}")
        ->assertForbidden();

    $this->actingAs($nurse)
        ->deleteJson("/api/records/patients/{$patient->user_id}")
        ->assertForbidden();

    $this->assertDatabaseHas('users', ['user_id' => $otherNurse->user_id]);
    $this->assertDatabaseHas('users', ['user_id' => $patient->user_id]);
});

test('each delete endpoint only removes accounts of its own type', function () {
    $admin = User::factory()->create(['role' => 'admin', 'clinic_id' => 'A-904']);
    $nurse = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-904']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-903']);

    $this->actingAs($admin)
        ->deleteJson("/api/records/staff/{$patient->user_id}")
        ->assertUnprocessable();

    $this->actingAs($admin)
        ->deleteJson("/api/records/patients/{$nurse->user_id}")
        ->assertUnprocessable();

    $this->assertDatabaseHas('users', ['user_id' => $nurse->user_id]);
    $this->assertDatabaseHas('users', ['user_id' => $patient->user_id]);
});
