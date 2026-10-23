<?php

namespace App\Http\Controllers;

use App\Http\Requests\PatientRegistrationRequest;
use App\Models\PprDemographic;
use App\Models\PprHealthQuestionnaire;
use App\Models\PprHealthRecord;
use App\Models\PprPermanent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class PatientRegistrationController extends Controller
{
    public function create()
    {
        return Inertia::render('Patient/Register');
    }

    /**
     * Create the patient's login account and their Permanent Patient Record
     * (demographics, institutional status, health record, questionnaire) together.
     * Either everything is saved or nothing is.
     */
    public function store(PatientRegistrationRequest $request)
    {
        $d = $request->validated();
        $isFemale = $d['sex'] === 'Female';

        $user = DB::transaction(function () use ($d, $isFemale) {
            // Role is always set here on the server; it is never taken from the form.
            $user = User::create([
                'clinic_id' => $d['clinic_id'],
                'firstname' => $d['firstname'],
                'middlename' => $d['middlename'],
                'lastname' => $d['lastname'],
                'usep_email' => $d['usep_email'],
                'role' => 'patient',
                'password' => Hash::make($d['password']),
            ]);

            $patientId = $user->user_id;

            PprDemographic::create([
                'patient_id' => $patientId,
                'dob' => $d['dob'],
                'sex' => $d['sex'],
                'civil_status' => $d['civil_status'],
                'religion' => $d['religion'],
                'birthplace' => $d['birthplace'],
                'nationality' => $d['nationality'],
                'city_address' => $d['city_address'],
                'prov_address' => $d['prov_address'],
                'contact_no' => $d['contact_no'],
                'em_name' => $d['em_name'],
                'em_contact' => $d['em_contact'],
                'em_rel' => $d['em_rel'],
            ]);

            PprPermanent::create([
                'patient_id' => $patientId,
                'patient_type' => $d['patient_type'],
                'college_dept' => $d['college_dept'],
                'year_level' => $d['patient_type'] === 'Faculty' ? 'N/A' : $d['year_level'],
            ]);

            PprHealthRecord::create([
                'patient_id' => $patientId,
                'gen_appearance' => $d['gen_appearance'] ?? null,
                'height' => $d['height'] . ' cm',
                'weight' => $d['weight'] . ' kg',
                'pulse_rate' => $d['pulse_rate'] . ' bpm',
                'resp_rate' => $d['resp_rate'] . ' br/min',
                'temp' => $d['temp'] . '°C',
                'blood_pressure' => $d['blood_pressure'],
                'cr_rest' => $d['cr_rest'] . ' bpm',
                'cr_activity' => $d['cr_activity'] . ' bpm',
                'infectious_diseases' => $d['infectious_diseases'] ?? null,
                'social_hx' => $d['social_hx'] ?? null,
                'family_hx' => $d['family_hx'] ?? null,
                'sr_skin' => $d['sr_skin'],
                'sr_lymph' => $d['sr_lymph'],
                'sr_integument' => $d['sr_integument'],
                'sr_circulatory' => $d['sr_circulatory'],
                'sr_endocrine' => $d['sr_endocrine'],
                'sr_allergic' => $d['sr_allergic'],
                'sr_heent' => $d['sr_heent'],
                'sr_mouth' => $d['sr_mouth'],
                'sr_breast' => $d['sr_breast'],
                'sr_respiratory' => $d['sr_respiratory'],
                'sr_cardiovascular' => $d['sr_cardiovascular'],
                'sr_gastrointestinal' => $d['sr_gastrointestinal'],
                'sr_genitourinary' => $d['sr_genitourinary'],
                'sr_psychiatric' => $d['sr_psychiatric'],
            ]);

            $infectious = $d['infectious'] ?? [];

            PprHealthQuestionnaire::create([
                'patient_id' => $patientId,
                'hosp_admitted' => $d['hosp_admitted'],
                'hosp_illness' => $d['hosp_admitted'] === 'Yes' ? $d['hosp_illness'] : null,
                'hosp_when' => $d['hosp_admitted'] === 'Yes' ? $d['hosp_when'] : null,
                'surgery' => $d['surgery'],
                'surg_type' => $d['surgery'] === 'Yes' ? $d['surg_type'] : null,
                'surg_when' => $d['surgery'] === 'Yes' ? $d['surg_when'] : null,
                'infectious_list' => $infectious ? implode(', ', $infectious) : 'None reported',
                'syncope' => $d['syncope'],
                'female_menarche' => $isFemale ? ($d['female_menarche'] ?? null) : null,
                'female_periods_yr' => $isFemale ? ($d['female_periods_yr'] ?? null) : null,
                'female_regular' => $isFemale ? ($d['female_regular'] ?? null) : null,
                'female_irregular_spec' => $isFemale ? ($d['female_irregular_spec'] ?? null) : null,
                'female_dysmenorrhea' => $isFemale ? ($d['female_dysmenorrhea'] ?? null) : null,
                'female_symptoms' => $isFemale ? ($d['female_symptoms'] ?? null) : null,
            ]);

            return $user;
        });

        // Sign the new patient straight in and send them to their portal.
        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('patient.dashboard');
    }
}
