<?php

use App\Models\User;
use App\Models\ClinicQueue;
use App\Models\TriageRecord;

beforeEach(function () {
    expect(config('database.default'))->toBe('sqlite');
    expect(config('database.connections.sqlite.database'))->toBe(':memory:');
    $this->withoutVite();
});

test('staff edit rejects future dates and malformed mobile numbers before saving', function () {
    $admin = User::factory()->create(['role'=>'admin']);
    $staff = User::factory()->create(['role'=>'nurse']);
    $this->actingAs($admin)->putJson('/api/records/staff/'.$staff->user_id, [
        'firstname'=>'AUDIT','lastname'=>"O'Neil",'usep_email'=>$staff->usep_email,
        'dob'=>now()->addDay()->toDateString(),'mobile_no'=>'not a phone',
    ])->assertUnprocessable()->assertJsonValidationErrors(['dob','mobile_no']);
    expect($staff->fresh()->firstname)->not->toBe('AUDIT');
});

test('endorsement rejects a patient as the assigned doctor', function () {
    $nurse=User::factory()->create(['role'=>'nurse']);
    $patient=User::factory()->create(['role'=>'patient']);
    $q=ClinicQueue::create(['patient_id'=>$patient->user_id,'queue_number'=>1,'date'=>today()->toDateString(),'status'=>'waiting','visit_type'=>'checkup']);
    $this->actingAs($nurse)->postJson('/api/v1/queues/'.$q->queue_id.'/endorse',['doctor_id'=>$patient->user_id])
        ->assertUnprocessable()->assertJsonValidationErrors('doctor_id');
    expect($q->fresh()->status)->toBe('waiting');
});

test('sync validates vitals before changing any queue status', function () {
    $nurse=User::factory()->create(['role'=>'nurse']);
    $patient=User::factory()->create(['role'=>'patient']);
    $q=ClinicQueue::create(['patient_id'=>$patient->user_id,'queue_number'=>1,'date'=>today()->toDateString(),'status'=>'waiting','visit_type'=>'checkup']);
    $this->actingAs($nurse)->postJson('/api/sync/save',['queue'=>[['queueNum'=>1,'date'=>today()->toDateString(),'status'=>'triaged','triage'=>['bp'=>str_repeat('A',51),'complaint'=>'Headache']]]])
        ->assertUnprocessable();
    expect($q->fresh()->status)->toBe('waiting');
    expect(TriageRecord::count())->toBe(0);
});

test('partial sync preserves omitted vitals and original recorder', function () {
    $nurse=User::factory()->create(['role'=>'nurse']);
    $other=User::factory()->create(['role'=>'nurse']);
    $patient=User::factory()->create(['role'=>'patient']);
    $q=ClinicQueue::create(['patient_id'=>$patient->user_id,'queue_number'=>1,'date'=>today()->toDateString(),'status'=>'triaged','visit_type'=>'checkup','triaged'=>true]);
    $triage=TriageRecord::create(['queue_id'=>$q->queue_id,'nurse_id'=>$nurse->user_id,'blood_pressure'=>'120/80','chief_complaint'=>'Headache']);
    $this->actingAs($other)->postJson('/api/sync/save',['queue'=>[['queueNum'=>1,'date'=>today()->toDateString(),'status'=>'triaged','triage'=>['notes'=>'Follow-up note']]]])->assertOk();
    expect($triage->fresh()->blood_pressure)->toBe('120/80');
    expect($triage->fresh()->chief_complaint)->toBe('Headache');
    expect($triage->fresh()->nurse_id)->toBe($nurse->user_id);
    expect($triage->fresh()->initial_notes)->toBe('Follow-up note');
});

test('sync reports unmatched queue instead of claiming data was saved', function () {
    $nurse=User::factory()->create(['role'=>'nurse']);
    $this->actingAs($nurse)->postJson('/api/sync/save',['queue'=>[['queueNum'=>99999,'date'=>today()->toDateString(),'status'=>'triaged','triage'=>['bp'=>'120/80','complaint'=>'Headache']]]])->assertUnprocessable();
});
