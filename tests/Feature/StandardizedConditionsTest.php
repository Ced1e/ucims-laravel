<?php

use App\Models\ClinicQueue;
use App\Models\Endorsed;
use App\Models\User;

// Standardized medical conditions: equivalent diagnoses must group under one
// condition name + ICD-10 code in the admin reports, and the diagnosis picker
// must surface the standardized label.

function conditionVisit(string $diagnosis, string $code): ClinicQueue
{
    static $n = 2000;

    $queue = ClinicQueue::create([
        'patient_id' => User::factory()->create(['role' => 'patient'])->user_id,
        'visit_type' => 'consult',
        'status' => 'done',
        'triaged' => true,
        'endorsed' => true,
        'queue_number' => ++$n,
        'date' => now()->toDateString(),
        'time_in' => '9:00 AM',
    ]);

    Endorsed::create([
        'queue_id' => $queue->queue_id,
        'doctor_id' => User::factory()->create(['role' => 'doctor'])->user_id,
        'diagnosis' => $diagnosis,
        'icd_10_code' => $code,
        'status' => 'completed',
    ]);

    return $queue;
}

it('attaches one standardized condition to equivalent completed visits', function () {
    conditionVisit('URI', '');
    conditionVisit('Common cold', 'J00');
    conditionVisit('Acute upper respiratory infection', 'J06.9');
    conditionVisit('Cough', 'R05');

    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->getJson('/api/v1/queues?completed=1&with_conditions=1')
        ->assertOk();

    $conditions = collect($response->json())->pluck('condition');

    expect($conditions->filter(fn ($c) => $c && $c['key'] === 'std:upper-respiratory-infection'))->toHaveCount(3)
        ->and($conditions->filter(fn ($c) => $c && $c['key'] === 'std:cough'))->toHaveCount(1)
        ->and($conditions->firstWhere('key', 'std:upper-respiratory-infection')['label'])
        ->toBe('Upper respiratory tract infection');
});

it('does not attach conditions unless the reports ask for them', function () {
    conditionVisit('URI', 'J06.9');

    $admin = User::factory()->create(['role' => 'admin']);

    $row = $this->actingAs($admin)
        ->getJson('/api/v1/queues?completed=1')
        ->assertOk()
        ->json('0');

    expect($row)->not->toHaveKey('condition');
});

it('returns standardized conditions first in the diagnosis search', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);

    $rows = $this->actingAs($doctor)
        ->getJson('/api/v1/icd10?q=sore%20throat&by=word')
        ->assertOk()
        ->json();

    expect($rows[0]['code'])->toBe('J02.9')
        ->and($rows[0]['name'])->toBe('Pharyngitis (sore throat)')
        ->and($rows[0]['standard'])->toBeTrue();
});

it('returns one row per standardized condition for name searches', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);

    $rows = $this->actingAs($doctor)
        ->getJson('/api/v1/icd10?q=common%20cold&by=word')
        ->assertOk()
        ->json();

    expect(collect($rows)->pluck('code')->all())->toBe(['J06.9'])
        ->and($rows[0]['name'])->toBe('Upper respiratory tract infection');
});

it('exposes the standardized catalogue for the reports tree', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $rows = $this->actingAs($admin)
        ->getJson('/api/v1/conditions')
        ->assertOk()
        ->json();

    $uri = collect($rows)->firstWhere('key', 'std:upper-respiratory-infection');

    expect(count($rows))->toBeGreaterThanOrEqual(70)
        ->and($uri['code'])->toBe('J06.9')
        ->and($uri['chapter'])->toBe('Respiratory')
        ->and($uri['aliases'])->toContain('uri');
});

it('pre-populates only the university-clinic body systems', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $rows = $this->actingAs($admin)->getJson('/api/v1/conditions')->assertOk()->json();
    $chapters = collect($rows)->pluck('chapter')->unique()->values()->all();

    $systems = [
        'Infectious', 'Blood & immunity', 'Endocrine', 'Mental health', 'Nervous',
        'Eye & ear', 'Circulatory', 'Respiratory', 'Digestive', 'Skin',
        'Musculoskeletal', 'Genitourinary', 'Symptoms & signs', 'Injury', 'Health services',
    ];

    $removed = ['Neoplasms', 'Pregnancy', 'Perinatal', 'Congenital'];

    expect(array_values(array_diff($systems, $chapters)))->toBe([])
        ->and(array_values(array_intersect($removed, $chapters)))->toBe([])
        ->and(count($rows))->toBeGreaterThanOrEqual(75)
        ->and(count($rows))->toBeLessThanOrEqual(120);
});

it('does not expose the condition catalogue to patients', function () {
    $patient = User::factory()->create(['role' => 'patient']);

    $this->actingAs($patient)->getJson('/api/v1/conditions')->assertForbidden();
});

it('keeps the diagnosis search on word boundaries', function () {
    $doctor = User::factory()->create(['role' => 'doctor']);

    $codes = collect(
        $this->actingAs($doctor)
            ->getJson('/api/v1/icd10?q=uri&by=word')
            ->assertOk()
            ->json()
    )->pluck('code');

    expect($codes)->toContain('J06.9')
        ->and($codes)->not->toContain('M79.2');
});
