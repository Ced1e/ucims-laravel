<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SyncController extends Controller
{
    public function load()
    {
        // Fetch all queue entries for today and attach the patient data
        $today = now()->timezone('Asia/Manila')->toDateString();
        
        $allQueues = \App\Models\ClinicQueue::with('patient')
            ->where('date', $today)
            ->get()
            ->map(function ($q) {
                $status = $q->status;
                $isFinalized = in_array($status, ['done', 'cancelled']);

                return [
                    "queueNum" => $q->queue_number,
                    "patientId" => $q->patient_id,
                    // Safely grab the patient's name if the relationship exists
                    "name" => $q->patient ? trim($q->patient->firstname . ' ' . $q->patient->lastname) : 'Unknown Patient',
                    "purpose" => $q->visit_type,
                    "purposeType" => $q->visit_type,
                    "visitLabel" => $q->visit_label ?? 'Check-up',
                    "status" => $status,
                    "time" => $q->time_in,
                    "timeIn" => $q->time_in,
                    "timeOut" => $q->time_out,
                    "date" => $q->date,
                    "triaged" => (bool) $q->triaged,
                    "endorsed" => (bool) $q->endorsed,
                    "finalized" => $isFinalized,
                    "triage" => [], 
                    "exam" => [],
                    "services" => []
                ];
            });

        // Split the data: active waiting room vs completed patients
        return response()->json([
            'status' => 'success',
            'queue' => $allQueues->where('finalized', false)->values(),
            'dailyLog' => $allQueues->where('finalized', true)->values()
        ]);
    }

    public function save(Request $request)
    {
        $data = $request->validate([
            'queue' => 'required|array|min:1|max:100',
            'queue.*.queueNum' => 'required|integer|min:1',
            'queue.*.date' => 'required|date_format:Y-m-d',
            'queue.*.status' => 'required|in:waiting,triaged,with-doctor,examined,done,cancelled',
            'queue.*.triage' => 'required|array:bp,hr,temp,rr,o2,weight,height,complaint,notes',
            'queue.*.triage.bp' => \App\Http\Requests\Concerns\InputRules::bloodPressure(),
            'queue.*.triage.hr' => \App\Http\Requests\Concerns\InputRules::vital(),
            'queue.*.triage.temp' => \App\Http\Requests\Concerns\InputRules::vital(),
            'queue.*.triage.rr' => \App\Http\Requests\Concerns\InputRules::vital(),
            'queue.*.triage.o2' => \App\Http\Requests\Concerns\InputRules::vital(),
            'queue.*.triage.weight' => \App\Http\Requests\Concerns\InputRules::vital(),
            'queue.*.triage.height' => \App\Http\Requests\Concerns\InputRules::vital(),
            'queue.*.triage.complaint' => 'nullable|string',
            'queue.*.triage.notes' => 'nullable|string',
        ]);

        $count = \Illuminate\Support\Facades\DB::transaction(function () use ($data, $request) {
            $count = 0;
            foreach ($data['queue'] as $index => $entry) {
                $queue = \App\Models\ClinicQueue::where('queue_number', $entry['queueNum'])
                    ->where('date', $entry['date'])->lockForUpdate()->first();
                if (!$queue) {
                    throw \Illuminate\Validation\ValidationException::withMessages(["queue.$index.queueNum" => 'This queue entry no longer exists. Refresh before saving.']);
                }
                $record = \App\Models\TriageRecord::where('queue_id', $queue->queue_id)->first();
                \Illuminate\Support\Facades\Gate::authorize($record ? 'update' : 'create', $record ?? \App\Models\TriageRecord::class);
                $updates = [];
                foreach (['bp'=>'blood_pressure', 'hr'=>'heart_rate', 'temp'=>'temperature', 'rr'=>'resp_rate', 'o2'=>'o2_saturation', 'weight'=>'weight', 'height'=>'height', 'complaint'=>'chief_complaint', 'notes'=>'initial_notes'] as $input => $column) {
                    if (array_key_exists($input, $entry['triage'])) $updates[$column] = $entry['triage'][$input];
                }
                foreach (['blood_pressure', 'chief_complaint'] as $field) {
                    $value = array_key_exists($field, $updates) ? $updates[$field] : $record?->$field;
                    if (blank($value)) throw \Illuminate\Validation\ValidationException::withMessages(["queue.$index.triage.$field" => 'Blood pressure and chief complaint are required before completing triage.']);
                }
                if ($record) $record->update($updates);
                else \App\Models\TriageRecord::create(array_merge($updates, ['queue_id'=>$queue->queue_id, 'nurse_id'=>$request->user()->user_id]));
                $queueUpdates = ['status'=>$entry['status'], 'triaged'=>true];
                if (in_array($entry['status'], ['done','examined'], true)) $queueUpdates['time_out'] = now()->format('g:i A');
                $queue->update($queueUpdates);
                $count++;
            }
            return $count;
        });

        return response()->json(['status'=>'success', 'message'=>'Queue and triage data synced.', 'updated'=>$count]);
    }
}
