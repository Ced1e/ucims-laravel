<?php

namespace App\Http\Controllers;

use App\Models\ClinicQueue;
use App\Models\User;
use App\Models\Endorsed;
use App\Http\Requests\StoreQueueRequest;
use App\Http\Requests\UpdateClinicQueueRequest;
use Illuminate\Http\Request;

class ClinicQueueController extends Controller
{
    public function index(Request $request)
    {
        $query = ClinicQueue::with(['patient', 'triage'])->orderBy('queue_id', 'desc');

        if ($request->boolean('assigned_to_me')) {
            $doctorId = $request->user()?->user_id;
            $query->whereHas('endorsement', fn ($q) => $q->where('doctor_id', $doctorId));
        }

        if ($request->boolean('mine')) {
            $query->where('patient_id', $request->user()?->user_id);
        }

        if ($request->boolean('completed')) {
            $query->where('status', 'done')
                ->with([
                    'patient.pprPermanent',
                    'patient.pprDemographic',
                    'triage.nurse',
                    'endorsement.doctor',
                    'endorsement.prescriptions',
                    'medicineIssuances.nurse',
                    'medicalCertificate',
                ]);
        }

        return response()->json($query->get());
    }

    public function store(StoreQueueRequest $request)
    {
        $data = $request->validated();
        $patientId = $request->user()?->user_id;
        $today = now()->toDateString();

        // A patient already mid-visit today shouldn't be able to join twice.
        $existing = ClinicQueue::where('patient_id', $patientId)
            ->where('date', $today)
            ->whereNotIn('status', ['done', 'cancelled'])
            ->first();

        if ($existing) {
            return response()->json($existing->load('patient'), 200);
        }

        $nextNumber = (int) ClinicQueue::where('date', $today)->max('queue_number') + 1;

        $queue = ClinicQueue::create([
            'patient_id' => $patientId,
            'visit_type' => $data['visit_type'],
            'visit_label' => $data['visit_label'] ?? null,
            'status' => 'waiting',
            'queue_number' => $nextNumber,
            'date' => $today,
            'time_in' => now()->format('g:i A'),
        ]);

        return response()->json($queue->load('patient'), 201);
    }

    public function show(ClinicQueue $clinicQueue)
    {
        $clinicQueue->load(['patient', 'triage', 'endorsement.prescriptions', 'endorsement.labRequests']);
        return response()->json($clinicQueue);
    }

    public function update(UpdateClinicQueueRequest $request, ClinicQueue $clinicQueue)
    {
        $data = $request->validated();

        // The server clock is the single source of truth for times, so the
        // browser's clock/format never leaks into the records.
        if (in_array($data['status'] ?? null, ['done', 'examined'], true)) {
            $data['time_out'] = now()->format('g:i A');
        }

        $clinicQueue->update($data);
        return response()->json($clinicQueue);
    }

    public function destroy(ClinicQueue $clinicQueue)
    {
        $clinicQueue->delete();
        return response()->json(['message' => 'Queue deleted successfully']);
    }

    /**
     * List doctors available to endorse a patient to.
     */
    public function doctors()
    {
        return response()->json(
            User::where('role', 'doctor')
                ->select('user_id', 'firstname', 'lastname')
                ->orderBy('firstname')
                ->get()
        );
    }

    /**
     * Endorse a queued patient to a doctor.
     */
    public function endorse(Request $request, ClinicQueue $clinicQueue)
    {
        $request->validate([
            'doctor_id' => 'required|exists:users,user_id',
        ]);

        Endorsed::updateOrCreate(
            ['queue_id' => $clinicQueue->queue_id],
            ['doctor_id' => $request->doctor_id, 'status' => 'pending']
        );

        $clinicQueue->update([
            'endorsed' => true,
            'status' => 'with-doctor',
        ]);

        return response()->json($clinicQueue->fresh()->load('patient'));
    }
}