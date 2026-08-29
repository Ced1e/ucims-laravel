<?php

namespace App\Http\Controllers;

use App\Models\TriageRecord;
use App\Http\Requests\StoreTriageRequest;
use Illuminate\Http\Request;

class TriageController extends Controller
{
    public function store(StoreTriageRequest $request)
    {
        $triage = TriageRecord::create($request->validated());
        
        // Optionally update queue triage status
        $queue = \App\Models\ClinicQueue::find($request->queue_id);
        if ($queue) {
            $queue->update(['triaged' => true]);
        }

        return response()->json($triage, 201);
    }

    public function show($queue_id)
    {
        $triage = TriageRecord::where('queue_id', $queue_id)->firstOrFail();
        return response()->json($triage);
    }
}