<?php

use App\Models\ClinicQueue;
use App\Models\Endorsed;
use App\Models\MedicineIssuance;
use App\Models\Prescription;
use App\Models\User;

// Regression tests for duplicate medicine entries on the nurse station.

function dedupePatient(): User
{
    return User::factory()->create(['role' => 'patient']);
}

function dedupeVisit(User $patient): ClinicQueue
{
    static $n = 1000;

    return ClinicQueue::create([
        'patient_id' => $patient->user_id,
        'visit_type' => 'consult',
        'status' => 'with-doctor',
        'triaged' => true,
        'endorsed' => true,
        'queue_number' => ++$n,
        'date' => now()->toDateString(),
        'time_in' => '9:00 AM',
    ]);
}

function dedupePrescription(ClinicQueue $queue, User $doctor, array $attrs = []): Prescription
{
    $endorsed = Endorsed::create([
        'queue_id' => $queue->queue_id,
        'doctor_id' => $doctor->user_id,
        'diagnosis' => 'Common cold',
        'status' => 'pending',
    ]);

    return Prescription::create(array_merge([
        'endorsed_id' => $endorsed->endorsed_id,
        'drug_name' => 'Paracetamol',
        'dosage' => '500mg',
        'frequency' => '3x a day',
        'duration' => '5 days',
        'route' => 'Oral',
        'treatment_instructions' => 'Take after meals',
    ], $attrs));
}

it('creates exactly one issuance per prescription and keeps it in sync', function () {
    $queue = dedupeVisit(dedupePatient());
    $prescription = dedupePrescription($queue, User::factory()->create(['role' => 'doctor']));

    $issuance = MedicineIssuance::where('prescription_id', $prescription->prescription_id)->sole();

    expect($issuance->queue_id)->toBe($queue->queue_id)
        ->and($issuance->nurse_id)->toBeNull()
        ->and($issuance->quantity)->toBe('as prescribed')
        ->and($issuance->dosage)->toBe('500mg')
        ->and($issuance->route)->toBe('Oral')
        ->and($issuance->instructions)->toBe('Take after meals');

    // Editing the prescription must refresh the linked row, not add a second.
    $prescription->update(['dosage' => '250mg', 'treatment_instructions' => 'Take with water']);

    expect(MedicineIssuance::where('queue_id', $queue->queue_id)->count())->toBe(1);

    $issuance->refresh();
    expect($issuance->dosage)->toBe('250mg')
        ->and($issuance->instructions)->toBe('Take with water')
        ->and($issuance->quantity)->toBe('as prescribed');

    // Removing the prescription removes its mirrored issuance.
    $prescription->delete();
    expect(MedicineIssuance::where('queue_id', $queue->queue_id)->count())->toBe(0);
});

it('updates the existing row instead of duplicating a repeated manual issuance', function () {
    $nurse = User::factory()->create(['role' => 'nurse']);
    $queue = dedupeVisit(dedupePatient());

    $this->actingAs($nurse)->postJson('/api/v1/medicine-issuances', [
        'queue_id' => $queue->queue_id,
        'medicine_name' => 'Paracetamol',
        'dosage' => '500mg',
        'quantity' => '10 tabs',
    ])->assertCreated();

    $this->actingAs($nurse)->postJson('/api/v1/medicine-issuances', [
        'queue_id' => $queue->queue_id,
        'medicine_name' => '  paracetamol ',
        'dosage' => ' 500 MG ',
        'quantity' => '12 tabs',
    ])->assertOk();

    $rows = MedicineIssuance::where('queue_id', $queue->queue_id)->get();

    expect($rows)->toHaveCount(1)
        ->and($rows->first()->quantity)->toBe('12 tabs')
        ->and($rows->first()->nurse_id)->toBe($nurse->user_id);
});

it('records a nurse dispense on the prescription row instead of a duplicate', function () {
    $nurse = User::factory()->create(['role' => 'nurse']);
    $queue = dedupeVisit(dedupePatient());
    $prescription = dedupePrescription($queue, User::factory()->create(['role' => 'doctor']));

    $this->actingAs($nurse)->postJson('/api/v1/medicine-issuances', [
        'queue_id' => $queue->queue_id,
        'medicine_name' => 'Paracetamol',
        'dosage' => '500mg',
        'quantity' => '15 tabs',
        'frequency' => '3x a day',
        'duration' => '5 days',
        'route' => 'Oral',
        'instructions' => 'Take after meals',
    ])->assertOk();

    $row = MedicineIssuance::where('queue_id', $queue->queue_id)->sole();

    expect($row->prescription_id)->toBe($prescription->prescription_id)
        ->and($row->quantity)->toBe('15 tabs')
        ->and($row->nurse_id)->toBe($nurse->user_id);
});

it('keeps different strengths of the same medicine as separate entries', function () {
    $nurse = User::factory()->create(['role' => 'nurse']);
    $queue = dedupeVisit(dedupePatient());

    $this->actingAs($nurse)->postJson('/api/v1/medicine-issuances', [
        'queue_id' => $queue->queue_id,
        'medicine_name' => 'Amoxicillin',
        'dosage' => '250mg',
        'quantity' => '9 caps',
    ])->assertCreated();

    $this->actingAs($nurse)->postJson('/api/v1/medicine-issuances', [
        'queue_id' => $queue->queue_id,
        'medicine_name' => 'Amoxicillin',
        'dosage' => '500mg',
        'quantity' => '9 caps',
    ])->assertCreated();

    expect(MedicineIssuance::where('queue_id', $queue->queue_id)->count())->toBe(2);
});
