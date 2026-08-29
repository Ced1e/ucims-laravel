<?php

namespace App\Http\Controllers;

use App\Models\MedicineIssuance;
use App\Http\Requests\StoreMedicineIssuanceRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicineIssuanceController extends Controller
{
    public function index()
    {
        $issuances = MedicineIssuance::with('endorsed')->orderBy('issuance_id', 'desc')->get();
        return Inertia::render('MedicineIssuances/Index', ['issuances' => $issuances]);
    }

    public function create()
    {
        return Inertia::render('MedicineIssuances/Create');
    }

    public function store(StoreMedicineIssuanceRequest $request)
    {
        $data = $request->validated();
        $data['date_issued'] = $data['date_issued'] ?? now()->format('Y-m-d');

        MedicineIssuance::create($data);
        return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance logged.');
    }

    public function edit(MedicineIssuance $medicineIssuance)
    {
        return Inertia::render('MedicineIssuances/Update', ['issuance' => $medicineIssuance]);
    }

    public function update(Request $request, MedicineIssuance $medicineIssuance)
    {
        $medicineIssuance->update($request->all());
        return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance updated.');
    }

    public function clone(MedicineIssuance $medicineIssuance)
    {
        $clone = $medicineIssuance->replicate();
        $clone->save();
        return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance cloned.');
    }

    public function destroy(MedicineIssuance $medicineIssuance)
    {
        $medicineIssuance->delete();
        return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance deleted.');
    }
}