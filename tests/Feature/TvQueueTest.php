<?php

use App\Models\ClinicQueue;
use App\Models\User;

function queueEntry(array $attrs = []): ClinicQueue
{
    $patient = User::factory()->create([
        'firstname' => 'Maria',
        'lastname' => 'Santos',
    ]);

    static $number = 0;

    return ClinicQueue::create(array_merge([
        'patient_id' => $patient->user_id,
        'visit_type' => 'consult',
        'visit_label' => 'Check-up',
        'status' => 'waiting',
        'triaged' => false,
        'endorsed' => false,
        'queue_number' => ++$number,
        'date' => now()->toDateString(),
        'time_in' => '9:00 AM',
    ], $attrs));
}

it('registers the live queue page as a public route', function () {
    // Checked on the route itself so the test does not need a built Vite manifest.
    $route = app('router')->getRoutes()->getByName('tv-queue');

    expect($route)->not->toBeNull()
        ->and($route->uri())->toBe('tv-queue')
        ->and($route->gatherMiddleware())->not->toContain('auth');
});

it('lets the TV feed be read without logging in', function () {
    $this->getJson('/api/tv-queue')
        ->assertOk()
        ->assertJsonStructure(['date', 'waiting', 'nurse', 'doctor', 'done']);
});

it('places each patient in the column that matches their stage today', function () {
    $waiting = queueEntry();
    $triaged = queueEntry(['triaged' => true]);          // triage form only sets the flag
    $examined = queueEntry(['status' => 'examined', 'triaged' => true]);
    $withDoctor = queueEntry(['status' => 'with-doctor', 'triaged' => true, 'endorsed' => true]);
    $done = queueEntry(['status' => 'done', 'triaged' => true, 'endorsed' => true]);

    $json = $this->getJson('/api/tv-queue')->assertOk()->json();

    expect(collect($json['waiting'])->pluck('queueNumber')->all())->toBe([$waiting->queue_number]);
    expect(collect($json['nurse'])->pluck('queueNumber')->sort()->values()->all())
        ->toBe([$triaged->queue_number, $examined->queue_number]);
    expect(collect($json['doctor'])->pluck('queueNumber')->all())->toBe([$withDoctor->queue_number]);
    expect(collect($json['done'])->pluck('queueNumber')->all())->toBe([$done->queue_number]);
});

it('hides cancelled visits and visits from other days', function () {
    queueEntry(['status' => 'cancelled']);
    queueEntry(['date' => now()->subDay()->toDateString()]);

    $json = $this->getJson('/api/tv-queue')->assertOk()->json();

    expect($json['waiting'])->toBeEmpty()
        ->and($json['nurse'])->toBeEmpty()
        ->and($json['doctor'])->toBeEmpty()
        ->and($json['done'])->toBeEmpty();
});

it('only exposes queue numbers and serving state', function () {
    queueEntry();

    $response = $this->getJson('/api/tv-queue')->assertOk();
    $entry = $response->json('waiting.0');

    expect($entry['serving'])->toBeFalse()
        ->and(array_keys($entry))->toEqualCanonicalizing(['queueNumber', 'serving']);

    $raw = $response->getContent();
    expect($raw)->not->toContain('Santos')
        ->not->toContain('usep_email')
        ->not->toContain('patient_id');
});

it('keeps only the five most recent completed visits', function () {
    foreach (range(1, 7) as $_) {
        queueEntry(['status' => 'done', 'triaged' => true, 'endorsed' => true]);
    }

    expect($this->getJson('/api/tv-queue')->json('done'))->toHaveCount(5);
});

it('marks a nurse assessment as serving and clears it when closed', function () {
    $queue = queueEntry();
    $nurse = User::factory()->create(['role' => 'nurse', 'is_active' => true]);
    $token = '11111111-1111-4111-8111-111111111111';
    $url = '/api/tv-queue/serving/'.$queue->queue_id;
    $this->actingAs($nurse)->postJson($url, ['active' => true, 'token' => $token])->assertNoContent();
    $this->getJson('/api/tv-queue')->assertJsonPath('nurse.0.serving', true)->assertJsonCount(0, 'waiting');
    $this->postJson($url, ['active' => false, 'token' => $token])->assertNoContent();
    $this->getJson('/api/tv-queue')->assertJsonCount(0, 'nurse')->assertJsonPath('waiting.0.serving', false);
});

it('expires abandoned assessments and rejects patients changing service state', function () {
    $queue = queueEntry();
    $url = '/api/tv-queue/serving/'.$queue->queue_id;
    $payload = ['active' => true, 'token' => '22222222-2222-4222-8222-222222222222'];
    $this->actingAs(User::factory()->create(['role' => 'patient']))->postJson($url, $payload)->assertForbidden();
    $this->actingAs(User::factory()->create(['role' => 'nurse', 'is_active' => true]))->postJson($url, $payload)->assertNoContent();
    $this->travel(76)->seconds();
    $this->getJson('/api/tv-queue')->assertJsonCount(0, 'nurse')->assertJsonPath('waiting.0.serving', false);
});

it('does not let an old assessment close a newer one or serve completed visits', function () {
    $queue = queueEntry();
    $nurse = User::factory()->create(['role' => 'nurse', 'is_active' => true]);
    $url = '/api/tv-queue/serving/'.$queue->queue_id;
    $old = '33333333-3333-4333-8333-333333333333';
    $new = '44444444-4444-4444-8444-444444444444';
    $this->actingAs($nurse)->postJson($url, ['active' => true, 'token' => $old])->assertNoContent();
    $this->postJson($url, ['active' => true, 'token' => $new])->assertNoContent();
    $this->postJson($url, ['active' => false, 'token' => $old])->assertNoContent();
    $this->getJson('/api/tv-queue')->assertJsonPath('nurse.0.serving', true);
    $queue->update(['status' => 'done']);
    $this->getJson('/api/tv-queue')->assertJsonCount(0, 'nurse')->assertJsonPath('done.0.serving', false);
    $this->postJson($url, ['active' => true, 'token' => $new])->assertStatus(409);
});
