<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Http\Requests\StorePrescriptionRequest;
use App\Http\Requests\UpdatePrescriptionRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;
use Illuminate\Support\Facades\Gate;

class PrescriptionController extends Controller
{
    public function index()
    {
        Gate::authorize('viewAny', Prescription::class);

        $prescriptions = Prescription::with('endorsed')->orderBy('prescription_id', 'desc')->get();
        return Inertia::render('Prescriptions/Index', ['prescriptions' => $prescriptions]);
    }

    public function create()
    {
        Gate::authorize('create', Prescription::class);

        return Inertia::render('Prescriptions/Create');
    }

    public function store(StorePrescriptionRequest $request)
    {
        Gate::authorize('create', Prescription::class);

        $prescription = Prescription::create($request->validated());

        if ($request->wantsJson()) {
            return response()->json($prescription, 201);
        }

        return redirect()->route('prescriptions.index')->with('success', 'Prescription added.');
    }

    public function edit(Prescription $prescription)
    {
        Gate::authorize('update', $prescription);

        return Inertia::render('Prescriptions/Update', ['prescription' => $prescription]);
    }

    public function update(UpdatePrescriptionRequest $request, Prescription $prescription)
    {
        Gate::authorize('update', $prescription);

    $prescription->update($request->validated());
    return redirect()->route('prescriptions.index')->with('success', 'Prescription updated.');
    }

    public function clone(Prescription $prescription, CloneRecordAction $cloner)
    {
        Gate::authorize('create', Prescription::class);

        $cloner->execute($prescription);
        return redirect()->route('prescriptions.index')->with('success', 'Prescription cloned.');
    }

    public function destroy(Request $request, Prescription $prescription)
    {
        Gate::authorize('delete', $prescription);

        $prescription->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Prescription deleted.']);
        }

        return redirect()->route('prescriptions.index')->with('success', 'Prescription deleted.');
    }
}