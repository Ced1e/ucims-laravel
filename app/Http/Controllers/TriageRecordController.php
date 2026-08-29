<?php

namespace App\Http\Controllers;

use App\Models\TriageRecord;
use App\Http\Requests\StoreTriageRecordRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TriageRecordController extends Controller
{
    public function index()
    {
        $records = TriageRecord::with(['queue', 'nurse'])->orderBy('triage_id', 'desc')->get();
        return Inertia::render('TriageRecord/Index', ['records' => $records]);
    }

    public function create()
    {
        return Inertia::render('TriageRecord/Create');
    }

    public function store(StoreTriageRecordRequest $request)
    {
        TriageRecord::create($request->validated());
        return redirect()->route('triage-records.index')->with('success', 'Triage record created.');
    }

    public function edit(TriageRecord $triageRecord)
    {
        return Inertia::render('TriageRecord/Update', ['record' => $triageRecord]);
    }

    public function update(Request $request, TriageRecord $triageRecord)
    {
        $triageRecord->update($request->all());
        return redirect()->route('triage-records.index')->with('success', 'Triage record updated.');
    }

    public function clone(TriageRecord $triageRecord)
    {
        $clone = $triageRecord->replicate();
        $clone->save();
        return redirect()->route('triage-records.index')->with('success', 'Triage record cloned.');
    }

    public function destroy(TriageRecord $triageRecord)
    {
        $triageRecord->delete();
        return redirect()->route('triage-records.index')->with('success', 'Triage record deleted.');
    }
}