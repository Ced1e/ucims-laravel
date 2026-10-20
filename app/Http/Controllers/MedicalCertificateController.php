<?php

namespace App\Http\Controllers;

use App\Models\MedicalCertificate;
use App\Http\Requests\StoreMedicalCertificateRequest;
use App\Http\Requests\UpdateMedicalCertificateRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;

class MedicalCertificateController extends Controller
{
    public function index(Request $request)
    {
        $query = MedicalCertificate::with(['queue.patient'])->orderBy('certificate_id', 'desc');

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
        return Inertia::render('MedicalCertificates/Create');
    }

    public function store(StoreMedicalCertificateRequest $request)
    {
    $data = $request->validated();
    $data['issued_date'] = $data['issued_date'] ?? now()->format('Y-m-d');

    $certificate = MedicalCertificate::create($data);

    if ($request->wantsJson()) {
        return response()->json($certificate, 201);
    }

    return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate created.');
    }

    public function edit(MedicalCertificate $medicalCertificate)
    {
        return Inertia::render('MedicalCertificates/Update', ['certificate' => $medicalCertificate]);
    }

    public function update(UpdateMedicalCertificateRequest $request, MedicalCertificate $medicalCertificate)
    {
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
    $cloner->execute($medicalCertificate);
    return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate cloned.');
    }

    public function destroy(MedicalCertificate $medicalCertificate)
    {
        $medicalCertificate->delete();
        return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate deleted.');
    }
}