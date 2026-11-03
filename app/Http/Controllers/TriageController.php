<?php

namespace App\Http\Controllers;

use App\Models\TriageRecord;
use App\Http\Requests\StoreTriageRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TriageController extends Controller
{
    public function store(StoreTriageRequest $request)
    {
        $data = $request->validated();

        // queue_id is unique on triage_record: saving again must update the
        // existing assessment (nurse correcting a mistake), not insert a duplicate.
        $triage = TriageRecord::where('queue_id', $data['queue_id'])->first();

        Gate::authorize($triage ? 'update' : 'create', $triage ?? TriageRecord::class);

        if ($triage) {
            unset($data['nurse_id']); // keep the nurse who first recorded it
            $triage->update($data);
            $status = 200;
        } else {
            $data['nurse_id'] = $request->user()->user_id;
            $triage = TriageRecord::create($data);
            $status = 201;
        }

        $queue = \App\Models\ClinicQueue::find($data['queue_id']);
        if ($queue && ! $queue->triaged) {
            $queue->update(['triaged' => true]);
        }

        return response()->json($triage->fresh(), $status);
    }

    public function show($queue_id)
    {
        $triage = TriageRecord::where('queue_id', $queue_id)->firstOrFail();
        Gate::authorize('view', $triage);

        return response()->json($triage);
    }
}