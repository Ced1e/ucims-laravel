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
        \Illuminate\Support\Facades\Log::info('Endorse Payload:', $request->all());

        // 1. Grab the incoming queue array
        $queues = $request->input('queue');
        
        if (!$queues) {
            return response()->json(['status' => 'error', 'message' => 'No data received']);
        }

        // 2. Loop through the queue and save triage records
        foreach ($queues as $qData) {
            // Check if this specific patient has submitted triage data
            if (isset($qData['triage']) && !empty($qData['triage'])) {
                
                // Find the existing queue record in the database using the queue number and today's date
                $queueModel = \App\Models\ClinicQueue::where('queue_number', $qData['queueNum'])
                    ->where('date', $qData['date'])
                    ->first();

                if ($queueModel) {
                    // Update the queue status to 'triaged'
                    $queueModel->status = $qData['status'];
                    $queueModel->triaged = true;
                    $queueModel->save();

                    // UpdateOrCreate the corresponding TriageRecord
                    \App\Models\TriageRecord::updateOrCreate(
                        ['queue_id' => $queueModel->queue_id], // Look for an existing record
                        [ // If not found, insert this new data using the correct schema columns
                            'blood_pressure' => $qData['triage']['bp'] ?? null,
                            'heart_rate' => $qData['triage']['hr'] ?? null,
                            'temperature' => $qData['triage']['temp'] ?? null,
                            'resp_rate' => $qData['triage']['rr'] ?? null,
                            'o2_saturation' => $qData['triage']['o2'] ?? null,
                            'weight' => $qData['triage']['weight'] ?? null,
                            'height' => $qData['triage']['height'] ?? null,
                            'chief_complaint' => $qData['triage']['complaint'] ?? null,
                            'initial_notes' => $qData['triage']['notes'] ?? null,
                            'nurse_id' => $qData['triage']['nurseId'] ?? null
                        ]
                    );
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Queue and Triage data successfully synced!'
        ]);
    }
}