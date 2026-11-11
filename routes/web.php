<?php

use App\Http\Controllers\RecordController;
use App\Http\Controllers\TvQueueController;
use App\Http\Controllers\ClinicQueueController;
use App\Http\Controllers\TriageRecordController;
use App\Http\Controllers\EndorsedController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\LabRequestController;
use App\Http\Controllers\MedicalCertificateController;
use App\Http\Controllers\MedicineIssuanceController;
use App\Http\Controllers\PatientAuthController;
use App\Http\Controllers\PprDemographicsController;
use App\Http\Controllers\PprHealthQuestionnaireController;
use App\Http\Controllers\PprHealthRecordController;
use App\Http\Controllers\PprPermanentController;
use App\Http\Controllers\StaffProfileController;
use App\Http\Controllers\PatientRegistrationController;
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
        'initialDesign' => max(1, min(5, (int) request('design', 1))),
    ]);
})->name('home');

// Local-only design review; the public home page stays unchanged.
if (app()->environment('local')) {
    Route::get('/previews/patient-canvas', function () {
        return Inertia::render('previews/PatientCanvas', [
            'initialDesign' => max(1, min(10, (int) request('design', 1))),
            'initialState' => in_array(request('state'), ['queue', 'triaged', 'doctor', 'examined', 'done', 'error']) ? request('state') : 'start',
        ]);
    });
    Route::get('/previews/nurse-canvas', function () {
        return Inertia::render('previews/NurseCanvas', [
            'initialDesign' => max(1, min(10, (int) request('design', 1))),
        ]);
    });
    Route::get('/previews/doctor-canvas', function () {
        return Inertia::render('previews/DoctorCanvas', [
            'initialDesign' => max(1, min(10, (int) request('design', 1))),
        ]);
    });
    Route::get('/previews/doctor-designs', function () {
        return Inertia::render('previews/DoctorDesigns', [
            'initialDesign' => max(1, min(5, (int) request('design', 1))),
        ]);
    });
    Route::get('/previews/authorization-designs', function () {
        return Inertia::render('previews/AuthorizationDesigns', [
            'initialDesign' => max(1, min(5, (int) request('design', 1))),
        ]);
    });
    Route::get('/previews/admin-reference', function () {
        return Inertia::render('previews/AdminReferenceDesigns', [
            'initialDesign' => max(1, min(5, (int) request('design', 1))),
        ]);
    });
    Route::get('/previews/admin-designs', function () {
        return Inertia::render('previews/AdminDesigns', [
            'initialDesign' => max(1, min(15, (int) request('design', 1))),
        ]);
    });
    Route::get('/previews/queue-designs', function () {
        return Inertia::render('previews/QueueDesigns', [
            'initialDesign' => max(1, min(10, (int) request('design', 1))),
        ]);
    });
    Route::get('/previews/home-designs', function () {
        return Inertia::render('previews/HomeDesigns', [
            'initialDesign' => max(1, min(5, (int) request('design', 1))),
        ]);
    });
    Route::get('/previews/home-refresh', function () {
        return Inertia::render('previews/HomeRefresh', [
            'initialDesign' => max(1, min(5, (int) request('design', 1))),
        ]);
    });
}

// Public waiting-room display.
Route::get('/tv-queue', [TvQueueController::class, 'show'])->name('tv-queue');
Route::get('/api/tv-queue', [TvQueueController::class, 'data'])->middleware('throttle:120,1')->name('tv-queue.data');
Route::post('/api/tv-queue/serving/{clinicQueue}', [TvQueueController::class, 'serving'])->middleware(['auth', 'throttle:60,1']);

// Patient self-registration (guests only). Throttled because it is a public form.
Route::middleware('guest')->group(function () {
    Route::get('/register', [PatientRegistrationController::class, 'create'])->name('register');
    Route::post('/register', [PatientRegistrationController::class, 'store'])->middleware('throttle:6,1');
});

// Role-Based Dashboards[cite: 2]
Route::middleware(['auth'])->group(function () {
    // Generic entry point: send each user to their own role's dashboard.
    Route::get('/dashboard', function () {
        $target = match (auth()->user()->role) {
            'admin' => 'admin.dashboard',
            'doctor' => 'doctor.dashboard',
            'nurse' => 'nurse.dashboard',
            'patient' => 'patient.dashboard',
            default => null,
        };

        return $target ? redirect()->route($target) : Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/doctor/dashboard', function () {
        return Inertia::render('Doctor/Consultation');
    })->name('doctor.dashboard');

    Route::get('/nurse/dashboard', function () {
        return Inertia::render('Nurse/Dashboard');
    })->name('nurse.dashboard');

    Route::get('/admin/dashboard', function () {
        return Inertia::render('Admin/Analytics');
    })->name('admin.dashboard');

    Route::get('/patient/dashboard', function () {
        return Inertia::render('Patient/Portal');
    })->name('patient.dashboard');
});

// All 14 Core System Modules (Resource Routes + Clone Actions)[cite: 2]
Route::middleware(['auth'])->group(function () {
    // 1. Clinic Queue
    Route::resource('clinic-queue', ClinicQueueController::class)
        ->parameters(['clinic-queue' => 'clinicQueue']);

    // 2. Triage Records
    Route::resource('triage-records', TriageRecordController::class)
        ->parameters(['triage-records' => 'triageRecord']);
    Route::post('triage-records/{triageRecord}/clone', [TriageRecordController::class, 'clone'])->name('triage-records.clone');

    // 3. Endorsed (Consultations)
    Route::resource('endorsed', EndorsedController::class);
    Route::post('endorsed/{endorsed}/clone', [EndorsedController::class, 'clone'])->name('endorsed.clone');

    // 4. Prescriptions
    Route::resource('prescriptions', PrescriptionController::class);
    Route::post('prescriptions/{prescription}/clone', [PrescriptionController::class, 'clone'])->name('prescriptions.clone');

    // 5. Lab Requests
    Route::resource('lab-requests', LabRequestController::class)
        ->parameters(['lab-requests' => 'labRequest']);
    Route::post('lab-requests/{labRequest}/clone', [LabRequestController::class, 'clone'])->name('lab-requests.clone');

    // 6. Medical Certificates
    Route::resource('medical-certificates', MedicalCertificateController::class)
        ->parameters(['medical-certificates' => 'medicalCertificate']);
    Route::post('medical-certificates/{medicalCertificate}/clone', [MedicalCertificateController::class, 'clone'])->name('medical-certificates.clone');

    // 7. Medicine Issuances
    Route::resource('medicine-issuances', MedicineIssuanceController::class)
        ->parameters(['medicine-issuances' => 'medicineIssuance']);
    Route::post('medicine-issuances/{medicineIssuance}/clone', [MedicineIssuanceController::class, 'clone'])->name('medicine-issuances.clone');

    // 8. Patient Auth
    Route::resource('patient-auth', PatientAuthController::class)
        ->parameters(['patient-auth' => 'patientAuth']);
    Route::post('patient-auth/{patientAuth}/clone', [PatientAuthController::class, 'clone'])->name('patient-auth.clone');

    // 9. PPR Demographics
    Route::resource('ppr-demographics', PprDemographicsController::class)
        ->parameters(['ppr-demographics' => 'pprDemographic']);
    Route::post('ppr-demographics/{pprDemographic}/clone', [PprDemographicsController::class, 'clone'])->name('ppr-demographics.clone');

    // 10. PPR Health Questionnaires
    Route::resource('ppr-health-questionnaires', PprHealthQuestionnaireController::class)
        ->parameters(['ppr-health-questionnaires' => 'pprHealthQuestionnaire']);
    Route::post('ppr-health-questionnaires/{pprHealthQuestionnaire}/clone', [PprHealthQuestionnaireController::class, 'clone'])->name('ppr-health-questionnaires.clone');

    // 11. PPR Health Records
    Route::resource('ppr-health-records', PprHealthRecordController::class)
        ->parameters(['ppr-health-records' => 'pprHealthRecord']);
    Route::post('ppr-health-records/{pprHealthRecord}/clone', [PprHealthRecordController::class, 'clone'])->name('ppr-health-records.clone');

    // 12. PPR Permanents
    Route::resource('ppr-permanents', PprPermanentController::class)
        ->parameters(['ppr-permanents' => 'pprPermanent']);
    Route::post('ppr-permanents/{pprPermanent}/clone', [PprPermanentController::class, 'clone'])->name('ppr-permanents.clone');

    // 13. Staff Profiles & Auth
    // Staff account management is admin-only
    Route::middleware('role:admin')->group(function () {
        Route::resource('staff', StaffProfileController::class);
        Route::post('staff/{staff}/clone', [StaffProfileController::class, 'clone'])->name('staff.clone');
    });

    // 14. Consultations
    Route::resource('consultations', ConsultationController::class);
    Route::post('consultations/{consultation}/clone', [ConsultationController::class, 'clone'])->name('consultations.clone');

    // Record Fetching Routes (moved inside auth — patient PII must not be publicly reachable)
    // Patient records: clinic staff only (patients must never reach other patients' data)
    Route::middleware('role:nurse,doctor,admin')->group(function () {
        Route::post('/api/records/deletion-requests', [RecordController::class, 'storeDeletionRequest'])->middleware('throttle:10,1');
        Route::get('/api/records/deletion-requests', [RecordController::class, 'getDeletionRequests']);
        Route::get('/api/records/patients', [RecordController::class, 'getPatients']);
        Route::get('/api/records/patients/{patient}', [RecordController::class, 'getPatientDetail']);
        Route::get('/api/records/patients/{patient}/visits', [RecordController::class, 'getPatientVisits']);
    });

    // Admin-only record tools
    Route::middleware('role:admin')->group(function () {
        Route::get('/api/records/validation', [RecordController::class, 'getRecordValidation']);
        Route::get('/api/records/staff', [RecordController::class, 'getStaff']);
        Route::put('/api/records/staff/{user}', [RecordController::class, 'updateStaff']);
        Route::put('/api/records/staff/{user}/role', [RecordController::class, 'updateStaffRole']);
        Route::put('/api/records/staff/{user}/password', [RecordController::class, 'updateStaffPassword']);
        Route::put('/api/records/staff/{user}/status', [RecordController::class, 'updateStaffStatus']);
    });
});

// Authentication API Routes
Route::post('/api/auth/login', [AuthController::class, 'login']);
Route::get('/api/auth/check', [AuthController::class, 'check']);
Route::post('/api/auth/register', [AuthController::class, 'register']);
Route::get('/api/auth/logout', [AuthController::class, 'logout']);

// Data Sync Route
Route::get('/api/sync/load', [SyncController::class, 'load'])->middleware(['auth', 'role:nurse,doctor,admin']);
Route::post('/api/sync/save', [SyncController::class, 'save'])->middleware(['auth', 'role:nurse,admin']);

require __DIR__.'/settings.php';
