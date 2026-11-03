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

it('only exposes a masked name and never private patient data', function () {
    queueEntry();

    $response = $this->getJson('/api/tv-queue')->assertOk();
    $entry = $response->json('waiting.0');

    expect($entry['name'])->toBe('Maria S.')
        ->and(array_keys($entry))->toEqualCanonicalizing(['queueNumber', 'name', 'visit']);

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
