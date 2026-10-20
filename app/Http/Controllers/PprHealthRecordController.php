<?php

namespace App\Http\Controllers;

use App\Models\PprHealthRecord;
use App\Http\Requests\StorePprHealthRecordRequest;
use App\Http\Requests\UpdatePprHealthRecordRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;

class PprHealthRecordController extends Controller
{
    public function index()
    {
    $records = PprHealthRecord::with('user')->orderBy('hr_id', 'desc')->get();
    return Inertia::render('PprHealthRecords/Index', ['records' => $records]);
    }

    public function create()
    {
        return Inertia::render('PprHealthRecords/Create');
    }

    public function store(StorePprHealthRecordRequest $request)
    {
    PprHealthRecord::create($request->validated());
    return redirect()->route('ppr-health-records.index')->with('success', 'Health record created.');
    }

    public function edit(PprHealthRecord $pprHealthRecord)
    {
        return Inertia::render('PprHealthRecords/Update', ['record' => $pprHealthRecord]);
    }

    public function update(UpdatePprHealthRecordRequest $request, PprHealthRecord $pprHealthRecord)
    {
    $pprHealthRecord->update($request->validated());
    return redirect()->route('ppr-health-records.index')->with('success', 'Health record updated.');
    }

    public function clone(PprHealthRecord $pprHealthRecord, CloneRecordAction $cloner)
    {
        $cloner->execute($pprHealthRecord);
        return redirect()->route('ppr-health-records.index')->with('success', 'Health record cloned.');
    }

    public function destroy(PprHealthRecord $pprHealthRecord)
    {
        $pprHealthRecord->delete();
        return redirect()->route('ppr-health-records.index')->with('success', 'Health record deleted.');
    }
}