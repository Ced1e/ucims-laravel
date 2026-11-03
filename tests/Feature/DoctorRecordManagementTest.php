<?php

use App\Models\User;

// Doctor "Record Management" is read-only: doctors may search patient records,
// open a record and view visit history, but may not use the admin-only tools.

test('guests cannot read patient records', function () {
    $this->getJson('/api/records/patients')->assertUnauthorized();
});

test('a doctor can list patients and open a record and visit history', function () {
    $doctor = User::factory()->create(['role' => 'doctor', 'clinic_id' => 'D-901']);
    $patient = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-901']);

    $this->actingAs($doctor);

    $this->getJson('/api/records/patients')
        ->assertOk()
        ->assertJsonPath('status', 'success')
        ->assertJsonFragment(['patientId' => 'P-901']);

    $this->getJson("/api/records/patients/{$patient->user_id}")
        ->assertOk()
        ->assertJsonPath('patient.clinic_id', 'P-901');

    $this->getJson("/api/records/patients/{$patient->user_id}/visits")
        ->assertOk()
        ->assertJsonPath('status', 'success');
});

test('a patient cannot read other patients records', function () {
    $patientA = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-902']);
    $patientB = User::factory()->create(['role' => 'patient', 'clinic_id' => 'P-903']);

    $this->actingAs($patientA);

    $this->getJson('/api/records/patients')->assertForbidden();
    $this->getJson("/api/records/patients/{$patientB->user_id}")->assertForbidden();
});

test('a doctor cannot use the admin-only record tools', function () {
    $doctor = User::factory()->create(['role' => 'doctor', 'clinic_id' => 'D-902']);
    $staff = User::factory()->create(['role' => 'nurse', 'clinic_id' => 'N-902']);

    $this->actingAs($doctor);

    $this->getJson('/api/records/staff')->assertForbidden();
    $this->getJson('/api/records/validation')->assertForbidden();
    $this->putJson("/api/records/staff/{$staff->user_id}/status", ['is_active' => false])->assertForbidden();
});
