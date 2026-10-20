<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Http\Requests\StorePrescriptionRequest;
use App\Http\Requests\UpdatePrescriptionRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;

class PrescriptionController extends Controller
{
    public function index()
    {
        $prescriptions = Prescription::with('endorsed')->orderBy('prescription_id', 'desc')->get();
        return Inertia::render('Prescriptions/Index', ['prescriptions' => $prescriptions]);
    }

    public function create()
    {
        return Inertia::render('Prescriptions/Create');
    }

    public function store(StorePrescriptionRequest $request)
    {
        $prescription = Prescription::create($request->validated());

        if ($request->wantsJson()) {
            return response()->json($prescription, 201);
        }

        return redirect()->route('prescriptions.index')->with('success', 'Prescription added.');
    }

    public function edit(Prescription $prescription)
    {
        return Inertia::render('Prescriptions/Update', ['prescription' => $prescription]);
    }

    public function update(UpdatePrescriptionRequest $request, Prescription $prescription)
    {
    $prescription->update($request->validated());
    return redirect()->route('prescriptions.index')->with('success', 'Prescription updated.');
    }

    public function clone(Prescription $prescription, CloneRecordAction $cloner)
    {
        $cloner->execute($prescription);
        return redirect()->route('prescriptions.index')->with('success', 'Prescription cloned.');
    }

    public function destroy(Request $request, Prescription $prescription)
    {
        $prescription->delete();

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Prescription deleted.']);
        }

        return redirect()->route('prescriptions.index')->with('success', 'Prescription deleted.');
    }
}