<?php

namespace App\Http\Controllers;

use App\Models\MedicineIssuance;
use App\Http\Requests\StoreMedicineIssuanceRequest;
use App\Http\Requests\UpdateMedicineIssuanceRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;
use Illuminate\Support\Facades\Gate;

class MedicineIssuanceController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', MedicineIssuance::class);

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
        Gate::authorize('create', MedicineIssuance::class);

        return Inertia::render('MedicineIssuances/Create');
    }

    public function store(StoreMedicineIssuanceRequest $request)
    {
        Gate::authorize('create', MedicineIssuance::class);

        $data = $request->validated();
        $data['issued_date'] = $data['issued_date'] ?? now()->format('Y-m-d H:i:s');
        $data['nurse_id'] = $request->user()->user_id;

        $issuance = MedicineIssuance::create($data);

        if ($request->wantsJson()) {
            return response()->json($issuance->load('nurse'), 201);
        }

        return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance logged.');
    }

    public function edit(MedicineIssuance $medicineIssuance)
    {
        Gate::authorize('update', $medicineIssuance);

        return Inertia::render('MedicineIssuances/Update', ['issuance' => $medicineIssuance]);
    }

    public function update(UpdateMedicineIssuanceRequest $request, MedicineIssuance $medicineIssuance)
    {
    Gate::authorize('update', $medicineIssuance);

    $data = $request->validated();
    unset($data['nurse_id']); // The recorded dispensing actor is not an editable form field.
    $medicineIssuance->update($data);
    return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance updated.');
    }

    public function clone(MedicineIssuance $medicineIssuance, CloneRecordAction $cloner)
    {
    Gate::authorize('create', MedicineIssuance::class);

    $cloner->execute($medicineIssuance);
    return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance cloned.');
    }

    public function destroy(MedicineIssuance $medicineIssuance)
    {
        Gate::authorize('delete', $medicineIssuance);

        $medicineIssuance->delete();
        return redirect()->route('medicine-issuances.index')->with('success', 'Medicine issuance deleted.');
    }
}