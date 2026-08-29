<?php

namespace App\Http\Controllers;

use App\Models\MedicalCertificate;
use App\Http\Requests\StoreMedicalCertificateRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MedicalCertificateController extends Controller
{
    public function index()
    {
        $certificates = MedicalCertificate::with('endorsed')->orderBy('cert_id', 'desc')->get();
        return Inertia::render('MedicalCertificates/Index', ['certificates' => $certificates]);
    }

    public function create()
    {
        return Inertia::render('MedicalCertificates/Create');
    }

    public function store(StoreMedicalCertificateRequest $request)
    {
        $data = $request->validated();
        $data['date_issued'] = $data['date_issued'] ?? now()->format('Y-m-d');
        
        MedicalCertificate::create($data);
        return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate created.');
    }

    public function edit(MedicalCertificate $medicalCertificate)
    {
        return Inertia::render('MedicalCertificates/Update', ['certificate' => $medicalCertificate]);
    }

    public function update(Request $request, MedicalCertificate $medicalCertificate)
    {
        $medicalCertificate->update($request->all());
        return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate updated.');
    }

    public function clone(MedicalCertificate $medicalCertificate)
    {
        $clone = $medicalCertificate->replicate();
        $clone->save();
        return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate cloned.');
    }

    public function destroy(MedicalCertificate $medicalCertificate)
    {
        $medicalCertificate->delete();
        return redirect()->route('medical-certificates.index')->with('success', 'Medical certificate deleted.');
    }
}