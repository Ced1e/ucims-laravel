<?php

use App\Models\User;

test('the current clinic ID login still works after the merge', function () {
    $user = User::factory()->create(['role' => 'patient']);
    $this->post('/login', ['clinic_id' => $user->clinic_id, 'password' => 'Password123!'])
        ->assertRedirect(route('patient.dashboard'));
    $this->assertAuthenticatedAs($user);
});

test('registration and the public TV board both survive the merge', function () {
    $this->withoutVite();
    $this->get('/register')->assertOk();
    $this->get('/tv-queue')->assertOk();
    expect(app('router')->getRoutes()->getByName('register')->getActionName())
        ->toBe('App\\Http\\Controllers\\PatientRegistrationController@create');
});

test('legacy sync requires staff authentication', function () {
    $this->getJson('/api/sync/load')->assertUnauthorized();
    $this->postJson('/api/sync/save', [])->assertUnauthorized();
    $this->actingAs(User::factory()->create(['role' => 'patient']));
    $this->getJson('/api/sync/load')->assertForbidden();
    $this->postJson('/api/sync/save', [])->assertForbidden();
});

test('doctors may read sync but cannot overwrite nursing triage through it', function () {
    $this->actingAs(User::factory()->create(['role' => 'doctor']));
    $this->getJson('/api/sync/load')->assertOk();
    $this->postJson('/api/sync/save', [])->assertForbidden();
});

test('deletion password checks are throttled', function () {
    $this->actingAs(User::factory()->create(['role' => 'nurse']));
    $patient = User::factory()->create(['role' => 'patient']);
    $payload = ['patient_id' => $patient->user_id, 'reason' => 'Duplicate patient record.', 'password' => 'wrong'];
    for ($i = 0; $i < 10; $i++) {
        $this->postJson('/api/records/deletion-requests', $payload)->assertUnprocessable();
    }
    $this->postJson('/api/records/deletion-requests', $payload)->assertTooManyRequests();
});

test('the obsolete passwordless token login is not routed', function () {
    $this->postJson('/api/v1/login', ['usep_email' => 'nobody@example.test'])->assertNotFound();
});
