<?php

namespace App\Http\Controllers;

use App\Models\MedicineIssuance;
use App\Http\Requests\StoreMedicineIssuanceRequest;
use App\Http\Requests\UpdateMedicineIssuanceRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;

class MedicineIssuanceController extends Controller
{
    public function index(Request $request)
    {
        $query = MedicineIssuance::with(['queue.patient', 'nurse'])->orderBy('issuance_id', 'desc');

        if ($request->filled('queue_id')) {
            $query->where('queue_id', $request->queue_id);
        }

        $issuances = $query->get();

        if ($request->wantsJson()) {
            return response()->json($issuances);
        }

        return Inertia::render('MedicineIssuances/Index', ['issuances' => $issuances]);
    }

    public function create()
    {
        return Inertia::render('MedicineIssuances/Create');
    }

    public function store(StoreMedicineIssuanceRequest $request)
    {
        $data = $request->validated();
        $data['issued_date'] = $data['issued_date'] ?? now()->format('Y-m-d H:i:s');
        $data['nurse_id'] = $data['nurse_id'] ?? $request->user()?->user_id;

        $issuance = MedicineIssuance::create($data);

        if ($request->wantsJson()) {
            return response()->json($issuance->load('nurse'), 201);
        }

        return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance logged.');
    }

    public function edit(MedicineIssuance $medicineIssuance)
    {
        return Inertia::render('MedicineIssuances/Update', ['issuance' => $medicineIssuance]);
    }

    public function update(UpdateMedicineIssuanceRequest $request, MedicineIssuance $medicineIssuance)
    {
    $medicineIssuance->update($request->validated());
    return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance updated.');
    }

    public function clone(MedicineIssuance $medicineIssuance, CloneRecordAction $cloner)
    {
    $cloner->execute($medicineIssuance);
    return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance cloned.');
    }

    public function destroy(MedicineIssuance $medicineIssuance)
    {
        $medicineIssuance->delete();
        return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance deleted.');
    }
}