<?php

namespace App\Http\Controllers;

use App\Models\ClinicQueue;
use App\Http\Requests\StoreQueueRequest;
use Illuminate\Http\Request;

class ClinicQueueController extends Controller
{
    public function index()
    {
        return response()->json(ClinicQueue::with('patient')->get());
    }

    public function store(StoreQueueRequest $request)
    {
        $queue = ClinicQueue::create($request->validated());
        return response()->json($queue, 201);
    }

    public function show($id)
    {
        $queue = ClinicQueue::with(['patient', 'triage', 'endorsed'])->findOrFail($id);
        return response()->json($queue);
    }

    public function update(Request $request, $id)
    {
        $queue = ClinicQueue::findOrFail($id);
        $queue->update($request->all());
        return response()->json($queue);
    }

    public function destroy($id)
    {
        $queue = ClinicQueue::findOrFail($id);
        $queue->delete();
        return response()->json(['message' => 'Queue deleted successfully']);
    }
}