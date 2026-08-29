<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Http\Requests\StorePrescriptionRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
        Prescription::create($request->validated());
        return redirect()->route('prescriptions.index')->with('success', 'Prescription added.');
    }

    public function edit(Prescription $prescription)
    {
        return Inertia::render('Prescriptions/Update', ['prescription' => $prescription]);
    }

    public function update(Request $request, Prescription $prescription)
    {
        $prescription->update($request->all());
        return redirect()->route('prescriptions.index')->with('success', 'Prescription updated.');
    }

    public function clone(Prescription $prescription)
    {
        $clone = $prescription->replicate();
        $clone->save();
        return redirect()->route('prescriptions.index')->with('success', 'Prescription cloned.');
    }

    public function destroy(Prescription $prescription)
    {
        $prescription->delete();
        return redirect()->route('prescriptions.index')->with('success', 'Prescription deleted.');
    }
}