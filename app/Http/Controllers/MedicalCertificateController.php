<?php

namespace App\Http\Controllers;

use App\Models\MedicalCertificate;
use App\Http\Requests\StoreMedicalCertificateRequest;
use App\Http\Requests\UpdateMedicalCertificateRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;

class MedicalCertificateController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', MedicalCertificate::class);

        $query = MedicalCertificate::with(['queue.patient'])->orderBy('certificate_id', 'desc');

        // A patient only ever sees his/her own certificates.
        if ($request->user()->role === 'patient') {
            $query->whereHas('queue', fn ($q) => $q->where('patient_id', $request->user()->user_id));
        }

        if ($request->has('released')) {
            $query->where('is_released', $request->boolean('released'));
        }

        $certificates = $query->get();

        if ($request->wantsJson()) {
            return response()->json($certificates);
        }

        return Inertia::render('MedicalCertificates/Index', ['certificates' => $certificates]);
    }

    public function create()
    {
        Gate::authorize('create', MedicalCertificate::class);

        return Inertia::render('MedicalCertificates/Create');
    }

    public function store(StoreMedicalCertificateRequest $request)
    {
    // Doctors/admins may issue; a patient may only request one for his/her own visit.
    Gate::authorize('create', [MedicalCertificate::class, $request->input('queue_id')]);

    $data = $request->validated();

    if ($request->user()->role === 'patient') {
        // A request can never mark itself as issued/released or name its own signer.
        $data = Arr::only($data, ['queue_id', 'diagnosis_reason', 'date_from', 'date_to', 'additional_notes']);
        $data['is_released'] = false;
    }

    $data['issued_date'] = $data['issued_date'] ?? now()->format('Y-m-d');

    $certificate = MedicalCertificate::create($data);

    if ($request->wantsJson()) {
        return response()->json($certificate, 201);
    }

    return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate created.');
    }

    public function edit(MedicalCertificate $medicalCertificate)
    {
        Gate::authorize('update', $medicalCertificate);

        return Inertia::render('MedicalCertificates/Update', ['certificate' => $medicalCertificate]);
    }

    public function update(UpdateMedicalCertificateRequest $request, MedicalCertificate $medicalCertificate)
    {
        Gate::authorize('update', $medicalCertificate);

        $data = $request->validated();

        if (($data['is_released'] ?? false) && !$medicalCertificate->is_released) {
            $data['issued_by'] = $request->user()?->user_id;
            $data['issued_date'] = now();
        }

        $medicalCertificate->update($data);

        if ($request->wantsJson()) {
            return response()->json($medicalCertificate->fresh()->load(['queue.patient', 'issuer']));
        }

        return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate updated.');
    }

    public function clone(MedicalCertificate $medicalCertificate, CloneRecordAction $cloner)
    {
    Gate::authorize('create', MedicalCertificate::class);

    $cloner->execute($medicalCertificate);
    return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate cloned.');
    }

    public function destroy(MedicalCertificate $medicalCertificate)
    {
        Gate::authorize('delete', $medicalCertificate);

        $medicalCertificate->delete();
        return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate deleted.');
    }
}