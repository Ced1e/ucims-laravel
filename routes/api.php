<?php

use App\Http\Controllers\ClinicQueueController;
use App\Http\Controllers\TriageController;
use App\Http\Controllers\MedicalCertificateController;
use App\Http\Controllers\LabRequestController;
use App\Http\Controllers\MedicineIssuanceController;
use App\Http\Controllers\PrescriptionController;
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
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::apiResource('queues', ClinicQueueController::class);
    Route::post('triage', [TriageController::class, 'store']);
    Route::get('triage/{queue_id}', [TriageController::class, 'show']);
    Route::apiResource('medical-certificates', MedicalCertificateController::class);
    Route::apiResource('lab-requests', LabRequestController::class);
    Route::apiResource('medicine-issuances', MedicineIssuanceController::class);
    Route::apiResource('prescriptions', PrescriptionController::class);
});