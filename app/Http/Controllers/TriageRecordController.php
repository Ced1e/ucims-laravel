<?php

namespace App\Http\Controllers;

use App\Models\TriageRecord;
use App\Http\Requests\StoreTriageRecordRequest;
use App\Http\Requests\UpdateTriageRecordRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;
use Illuminate\Support\Facades\Gate;

class TriageRecordController extends Controller
{
    public function index()
    {
        Gate::authorize('viewAny', TriageRecord::class);

        $records = TriageRecord::with(['queue', 'nurse'])->orderBy('triage_id', 'desc')->get();
        return Inertia::render('TriageRecord/Index', ['records' => $records]);
    }

    public function create()
    {
        Gate::authorize('create', TriageRecord::class);

        return Inertia::render('TriageRecord/Create');
    }

    public function store(StoreTriageRecordRequest $request)
    {
        Gate::authorize('create', TriageRecord::class);

        \Illuminate\Support\Facades\DB::transaction(function () use ($request) {
            $record = TriageRecord::create(array_merge($request->validated(), ['nurse_id' => $request->user()->user_id]));
            $record->queue()->update(['triaged' => true]);
        });
        return redirect()->route('triage-records.index')->with('success', 'Triage record created.');
    }

    public function edit(TriageRecord $triageRecord)
    {
        Gate::authorize('update', $triageRecord);

        return Inertia::render('TriageRecord/Update', ['record' => $triageRecord]);
    }

    public function update(UpdateTriageRecordRequest $request, TriageRecord $triageRecord)
    {
    Gate::authorize('update', $triageRecord);

    $data = $request->validated();
    unset($data['nurse_id']);
    $triageRecord->update($data);
    return redirect()->route('triage-records.index')->with('success', 'Triage record updated.');
    }

    public function clone(TriageRecord $triageRecord, CloneRecordAction $cloner)
    {
        Gate::authorize('create', TriageRecord::class);

        $cloner->execute($triageRecord);
        return redirect()->route('triage-records.index')->with('success', 'Triage record cloned.');
    }

    public function destroy(TriageRecord $triageRecord)
    {
        Gate::authorize('delete', $triageRecord);

        $triageRecord->delete();
        return redirect()->route('triage-records.index')->with('success', 'Triage record deleted.');
    }
}