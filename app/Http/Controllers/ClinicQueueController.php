<?php

namespace App\Http\Controllers;

use App\Models\ClinicQueue;
use App\Models\User;
use App\Models\Endorsed;
use App\Http\Requests\StoreQueueRequest;
use App\Http\Requests\UpdateClinicQueueRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ClinicQueueController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', ClinicQueue::class);

        // The patient portal only needs queue numbers + statuses of other people
        // to show "x people ahead of you". Never send other patients' records.
        if ($request->user()->role === 'patient' && ! $request->boolean('mine')) {
            return response()->json(
                ClinicQueue::where('date', now()->toDateString())
                    ->whereNotIn('status', ['done', 'cancelled'])
                    ->orderBy('queue_number')
                    ->get(['queue_number', 'status'])
            );
        }

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
        Gate::authorize('create', ClinicQueue::class);

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
        Gate::authorize('view', $clinicQueue);

        $clinicQueue->load(['patient', 'triage', 'endorsement.prescriptions', 'endorsement.labRequests']);
        return response()->json($clinicQueue);
    }

    public function update(UpdateClinicQueueRequest $request, ClinicQueue $clinicQueue)
    {
        Gate::authorize('update', $clinicQueue);

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
        Gate::authorize('delete', $clinicQueue);

        $clinicQueue->delete();
        return response()->json(['message' => 'Queue deleted successfully']);
    }

    /**
     * List doctors available to endorse a patient to.
     */
    public function doctors()
    {
        Gate::authorize('endorse', ClinicQueue::class);

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
        Gate::authorize('endorse', $clinicQueue);

        $request->validate([
            'doctor_id' => ['required', \Illuminate\Validation\Rule::exists('users', 'user_id')->where('role', 'doctor')->where('is_active', true)],
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