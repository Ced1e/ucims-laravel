<?php

namespace App\Http\Controllers;

use App\Models\PprHealthRecord;
use App\Http\Requests\StorePprHealthRecordRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PprHealthRecordController extends Controller
{
    public function index()
    {
        $records = PprHealthRecord::with('user')->orderBy('health_record_id', 'desc')->get();
        return Inertia::render('PprHealthRecords/Index', ['records' => $records]);
    }

    public function create()
    {
        return Inertia::render('PprHealthRecords/Create');
    }

    public function store(StorePprHealthRecordRequest $request)
    {
        $data = $request->validated();
        $data['date_recorded'] = $data['date_recorded'] ?? now()->format('Y-m-d');

        PprHealthRecord::create($data);
        return redirect()->route('ppr-health-records.index')->with('success', 'Health record created.');
    }

    public function edit(PprHealthRecord $pprHealthRecord)
    {
        return Inertia::render('PprHealthRecords/Update', ['record' => $pprHealthRecord]);
    }

    public function update(Request $request, PprHealthRecord $pprHealthRecord)
    {
        $pprHealthRecord->update($request->all());
        return redirect()->route('ppr-health-records.index')->with('success', 'Health record updated.');
    }

    public function clone(PprHealthRecord $pprHealthRecord)
    {
        $clone = $pprHealthRecord->replicate();
        $clone->save();
        return redirect()->route('ppr-health-records.index')->with('success', 'Health record cloned.');
    }

    public function destroy(PprHealthRecord $pprHealthRecord)
    {
        $pprHealthRecord->delete();
        return redirect()->route('ppr-health-records.index')->with('success', 'Health record deleted.');
    }
}