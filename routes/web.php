<?php

use App\Http\Controllers\RecordController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ClinicQueueController;
use App\Http\Controllers\TriageRecordController;
use App\Http\Controllers\EndorsedController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\LabRequestController;
use App\Http\Controllers\MedicalCertificateController;
use App\Http\Controllers\MedicineIssuanceController;
use App\Http\Controllers\PatientAuthController;
use App\Http\Controllers\PprDemographicController;
use App\Http\Controllers\PprHealthQuestionnaireController;
use App\Http\Controllers\PprHealthRecordController;
use App\Http\Controllers\PprPermanentController;
use App\Http\Controllers\StaffProfileController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SyncController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Welcome[cite: 2]
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Role-Based Dashboards[cite: 2]
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/doctor/dashboard', function () {
        return Inertia::render('Doctor/Dashboard');
    })->name('doctor.dashboard');

    Route::get('/nurse/dashboard', function () {
        return Inertia::render('Nurse/Dashboard');
    })->name('nurse.dashboard');

    Route::get('/admin/dashboard', function () {
        return Inertia::render('Admin/Dashboard');
    })->name('admin.dashboard');

    Route::get('/patient/dashboard', function () {
        return Inertia::render('Patient/Dashboard');
    })->name('patient.dashboard');
});

// All 14 Core System Modules (Resource Routes + Clone Actions)[cite: 2]
Route::middleware(['auth'])->group(function () {
    // 1. Clinic Queue
    Route::resource('clinic-queue', ClinicQueueController::class);

    // 2. Triage Records
    Route::resource('triage-records', TriageRecordController::class);
    Route::post('triage-records/{triage_record}/clone', [TriageRecordController::class, 'clone'])->name('triage-records.clone');

    // 3. Endorsed (Consultations)
    Route::resource('endorsed', EndorsedController::class);
    Route::post('endorsed/{endorsed}/clone', [EndorsedController::class, 'clone'])->name('endorsed.clone');

    // 4. Prescriptions
    Route::resource('prescriptions', PrescriptionController::class);
    Route::post('prescriptions/{prescription}/clone', [PrescriptionController::class, 'clone'])->name('prescriptions.clone');

    // 5. Lab Requests
    Route::resource('lab-requests', LabRequestController::class);
    Route::post('lab-requests/{lab_request}/clone', [LabRequestController::class, 'clone'])->name('lab-requests.clone');

    // 6. Medical Certificates
    Route::resource('medical-certificates', MedicalCertificateController::class);
    Route::post('medical-certificates/{medical_certificate}/clone', [MedicalCertificateController::class, 'clone'])->name('medical-certificates.clone');

    // 7. Medicine Issuances
    Route::resource('medicine-issuances', MedicineIssuanceController::class);
    Route::post('medicine-issuances/{medicine_issuance}/clone', [MedicineIssuanceController::class, 'clone'])->name('medicine-issuances.clone');

    // 8. Patient Auth
    Route::resource('patient-auth', PatientAuthController::class);
    Route::post('patient-auth/{patient_auth}/clone', [PatientAuthController::class, 'clone'])->name('patient-auth.clone');

    // 9. PPR Demographics
    Route::resource('ppr-demographics', PprDemographicController::class);
    Route::post('ppr-demographics/{ppr_demographic}/clone', [PprDemographicController::class, 'clone'])->name('ppr-demographics.clone');

    // 10. PPR Health Questionnaires
    Route::resource('ppr-health-questionnaires', PprHealthQuestionnaireController::class);
    Route::post('ppr-health-questionnaires/{ppr_health_questionnaire}/clone', [PprHealthQuestionnaireController::class, 'clone'])->name('ppr-health-questionnaires.clone');

    // 11. PPR Health Records
    Route::resource('ppr-health-records', PprHealthRecordController::class);
    Route::post('ppr-health-records/{ppr_health_record}/clone', [PprHealthRecordController::class, 'clone'])->name('ppr-health-records.clone');

    // 12. PPR Permanents
    Route::resource('ppr-permanents', PprPermanentController::class);
    Route::post('ppr-permanents/{ppr_permanent}/clone', [PprPermanentController::class, 'clone'])->name('ppr-permanents.clone');

    // 13. Staff Profiles & Auth
    Route::resource('staff', StaffProfileController::class);
    Route::post('staff/{staff}/clone', [StaffProfileController::class, 'clone'])->name('staff.clone');

    // 14. Consultations
    Route::resource('consultations', ConsultationController::class);
    Route::post('consultations/{consultation}/clone', [ConsultationController::class, 'clone'])->name('consultations.clone');
});

// Authentication API Routes
Route::post('/api/auth/login', [AuthController::class, 'login']);
Route::get('/api/auth/check', [AuthController::class, 'check']);
Route::post('/api/auth/register', [AuthController::class, 'register']);
Route::get('/api/auth/logout', [AuthController::class, 'logout']);

// Data Sync Route
Route::get('/api/sync/load', [SyncController::class, 'load']);
Route::post('/api/sync/save', [SyncController::class, 'save']);

// Record Fetching Routes
Route::get('/api/records/patients', [RecordController::class, 'getPatients']);
Route::get('/api/records/staff', [RecordController::class, 'getStaff']);