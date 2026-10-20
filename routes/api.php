<?php

use App\Http\Controllers\ClinicQueueController;
use App\Http\Controllers\EndorsedController;
use App\Http\Controllers\TriageController;
use App\Http\Controllers\MedicalCertificateController;
use App\Http\Controllers\LabRequestController;
use App\Http\Controllers\MedicineIssuanceController;
use App\Http\Controllers\PrescriptionController;
use App\Models\ClinicQueue;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Token-Issuing Login Endpoint
Route::post('/v1/login', function (Request $request) {
    $request->validate([
        'usep_email' => 'required|email',
    ]);

    $user = User::where('usep_email', $request->usep_email)->first();

    if (! $user) {
        return response()->json(['message' => 'Invalid credentials.'], 401);
    }

    $token = $user->createToken('ucims-api-token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user
    ]);
});

// Protected Clinical API Routes
Route::prefix('v1')->middleware(['web', 'auth'])->name('api.')->group(function () {
    Route::apiResource('queues', ClinicQueueController::class)
        ->parameters(['queues' => 'clinicQueue']);

    Route::get('doctors', [ClinicQueueController::class, 'doctors']);
    Route::post('queues/{clinicQueue}/endorse', [ClinicQueueController::class, 'endorse']);

    Route::apiResource('endorsed', EndorsedController::class)->only(['show', 'update']);

    Route::middleware('role:admin')->get('admin/stats', function (Request $request) {
        return response()->json([
            'total_patients' => User::where('role', 'patient')->count(),
            'total_staff' => User::whereIn('role', ['doctor', 'nurse', 'admin'])->count(),
            'active_queue' => ClinicQueue::whereNotIn('status', ['done', 'cancelled'])->count(),
            'today_visits' => ClinicQueue::where('date', now()->toDateString())->count(),
        ]);
    });

    Route::post('triage', [TriageController::class, 'store']);
    Route::get('triage/{queue_id}', [TriageController::class, 'show']);

    Route::apiResource('medical-certificates', MedicalCertificateController::class)
        ->parameters(['medical-certificates' => 'medicalCertificate']);

    Route::apiResource('lab-requests', LabRequestController::class)
        ->parameters(['lab-requests' => 'labRequest']);

    Route::apiResource('medicine-issuances', MedicineIssuanceController::class)
        ->parameters(['medicine-issuances' => 'medicineIssuance']);

    Route::apiResource('prescriptions', PrescriptionController::class);
});