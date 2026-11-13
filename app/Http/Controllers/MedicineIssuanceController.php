<?php

namespace App\Http\Controllers;

use App\Actions\CloneRecordAction;
use App\Http\Requests\StoreMedicineIssuanceRequest;
use App\Http\Requests\UpdateMedicineIssuanceRequest;
use App\Models\MedicineIssuance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

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

        // One medicine per patient visit: re-issuing the same drug/dosage for
        // the same queue records the dispense on the existing row instead of
        // adding a second, duplicate entry.
        $existing = $this->findExistingIssuance($data);

        if ($existing) {
            $existing->update($data);
            $issuance = $existing;
        } else {
            $issuance = MedicineIssuance::create($data);
        }

        if ($request->wantsJson()) {
            return response()->json($issuance->load('nurse'), $existing ? 200 : 201);
        }

        return redirect()->route('medicine-issuances.index')->with(
            'success',
            $existing ? 'Existing medicine issuance updated.' : 'Medicine issuance logged.'
        );
    }

    /**
     * Match on visit + medicine name + dosage, ignoring letter case and extra
     * whitespace ("500 mg" and "500MG" are the same strength). Different
     * drugs, strengths or visits never match.
     */
    private function findExistingIssuance(array $data): ?MedicineIssuance
    {
        if (empty($data['queue_id']) || empty($data['medicine_name'])) {
            return null;
        }

        $name = $this->normalizeMedicineName($data['medicine_name']);
        $dosage = $this->normalizeDosage($data['dosage'] ?? '');

        return MedicineIssuance::query()
            ->where('queue_id', $data['queue_id'])
            ->orderBy('issuance_id')
            ->get()
            ->first(fn (MedicineIssuance $row) => $this->normalizeMedicineName($row->medicine_name) === $name
                && $this->normalizeDosage($row->dosage) === $dosage);
    }

    private function normalizeMedicineName(?string $value): string
    {
        return mb_strtolower(preg_replace('/\s+/', ' ', trim((string) $value)));
    }

    private function normalizeDosage(?string $value): string
    {
        return preg_replace('/\s+/', '', mb_strtolower(trim((string) $value)));
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
