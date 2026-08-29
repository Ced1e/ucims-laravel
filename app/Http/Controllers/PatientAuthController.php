<?php

namespace App\Http\Controllers;

use App\Models\PatientAuth;
use App\Http\Requests\StorePatientAuthRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class PatientAuthController extends Controller
{
    public function index()
    {
        $auths = PatientAuth::with('user')->orderBy('patient_auth_id', 'desc')->get();
        return Inertia::render('PatientAuth/Index', ['auths' => $auths]);
    }

    public function create()
    {
        return Inertia::render('PatientAuth/Create');
    }

    public function store(StorePatientAuthRequest $request)
    {
        PatientAuth::create([
            'user_id' => $request->user_id,
            'password_hash' => Hash::make($request->password_hash),
        ]);
        return redirect()->route('patient-auth.index')->with('success', 'Patient credentials created.');
    }

    public function edit(PatientAuth $patientAuth)
    {
        return Inertia::render('PatientAuth/Update', ['auth' => $patientAuth]);
    }

    public function update(Request $request, PatientAuth $patientAuth)
    {
        $data = $request->except(['password_hash']);
        if ($request->filled('password_hash')) {
            $data['password_hash'] = Hash::make($request->password_hash);
        }
        $patientAuth->update($data);
        return redirect()->route('patient-auth.index')->with('success', 'Patient credentials updated.');
    }

    public function clone(PatientAuth $patientAuth)
    {
        $clone = $patientAuth->replicate();
        $clone->save();
        return redirect()->route('patient-auth.index')->with('success', 'Patient credentials cloned.');
    }

    public function destroy(PatientAuth $patientAuth)
    {
        $patientAuth->delete();
        return redirect()->route('patient-auth.index')->with('success', 'Patient credentials deleted.');
    }
}