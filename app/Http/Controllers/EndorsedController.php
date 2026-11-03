<?php

namespace App\Http\Controllers;

use App\Models\Endorsed;
use App\Http\Requests\StoreEndorsedRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Requests\UpdateEndorsedRequest;
use App\Actions\CloneRecordAction;
use Illuminate\Support\Facades\Gate;

class EndorsedController extends Controller
{
    public function index()
    {
        Gate::authorize('viewAny', Endorsed::class);

        $endorsements = Endorsed::with(['queue', 'doctor'])->orderBy('endorsed_id', 'desc')->get();
        return Inertia::render('Endorsed/Index', ['endorsements' => $endorsements]);
    }

    public function create()
    {
        Gate::authorize('create', Endorsed::class);

        return Inertia::render('Endorsed/Create');
    }

    public function show(Request $request, Endorsed $endorsed)
    {
        Gate::authorize('view', $endorsed);

        $endorsed->load(['queue.patient', 'queue.triage', 'doctor', 'prescriptions', 'labRequests']);

        if ($request->wantsJson()) {
            return response()->json($endorsed);
        }

        return Inertia::render('Endorsed/Show', ['endorsed' => $endorsed]);
    }

    public function store(StoreEndorsedRequest $request)
    {
        Gate::authorize('create', Endorsed::class);

        Endorsed::create($request->validated());
        return redirect()->route('endorsed.index')->with('success', 'Consultation record saved.');
    }

    public function edit(Endorsed $endorsed)
    {
        Gate::authorize('update', $endorsed);

        return Inertia::render('Endorsed/Update', ['endorsed' => $endorsed]);
    }

    public function update(UpdateEndorsedRequest $request, Endorsed $endorsed)
    {
        Gate::authorize('update', $endorsed);

        $endorsed->update($request->validated());

        if ($request->wantsJson()) {
            return response()->json($endorsed->fresh()->load(['prescriptions', 'labRequests']));
        }

        return redirect()->route('endorsed.index')->with('success', 'Consultation record updated.');
    }

    public function clone(Endorsed $endorsed, CloneRecordAction $cloner)
    {
        Gate::authorize('create', Endorsed::class);

        $cloner->execute($endorsed);
        return redirect()->route('endorsed.index')->with('success', 'Consultation record cloned.');
    }

    public function destroy(Endorsed $endorsed)
    {
        Gate::authorize('delete', $endorsed);

        $endorsed->delete();
        return redirect()->route('endorsed.index')->with('success', 'Consultation record deleted.');
    }
}