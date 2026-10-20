<?php

namespace App\Http\Controllers;

use App\Models\Endorsed;
use App\Http\Requests\StoreEndorsedRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\UpdateEndorsedRequest;
use App\Actions\CloneRecordAction;

class EndorsedController extends Controller
{
    public function index()
    {
        $endorsements = Endorsed::with(['queue', 'doctor'])->orderBy('endorsed_id', 'desc')->get();
        return Inertia::render('Endorsed/Index', ['endorsements' => $endorsements]);
    }

    public function create()
    {
        return Inertia::render('Endorsed/Create');
    }

    public function show(Request $request, Endorsed $endorsed)
    {
        $endorsed->load(['queue.patient', 'queue.triage', 'doctor', 'prescriptions', 'labRequests']);

        if ($request->wantsJson()) {
            return response()->json($endorsed);
        }

        return Inertia::render('Endorsed/Show', ['endorsed' => $endorsed]);
    }

    public function store(StoreEndorsedRequest $request)
    {
        Endorsed::create($request->validated());
        return redirect()->route('endorsed.index')->with('success', 'Consultation record saved.');
    }

    public function edit(Endorsed $endorsed)
    {
        return Inertia::render('Endorsed/Update', ['endorsed' => $endorsed]);
    }

    public function update(UpdateEndorsedRequest $request, Endorsed $endorsed)
    {
        $endorsed->update($request->validated());

        if ($request->wantsJson()) {
            return response()->json($endorsed->fresh()->load(['prescriptions', 'labRequests']));
        }

        return redirect()->route('endorsed.index')->with('success', 'Consultation record updated.');
    }

    public function clone(Endorsed $endorsed, CloneRecordAction $cloner)
    {
        $cloner->execute($endorsed);
        return redirect()->route('endorsed.index')->with('success', 'Consultation record cloned.');
    }

    public function destroy(Endorsed $endorsed)
    {
        $endorsed->delete();
        return redirect()->route('endorsed.index')->with('success', 'Consultation record deleted.');
    }
}