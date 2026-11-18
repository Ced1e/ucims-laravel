<?php

namespace App\Http\Controllers;

use App\Models\ClinicQueue;
use App\Models\User;
use App\Models\Endorsed;
use App\Support\MedicalConditions;
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

        $rows = $query->get();

        // Reports ask for the standardized condition alongside each completed
        // visit so equivalent diagnoses group under one name and ICD-10 code.
        if ($request->boolean('completed') && $request->boolean('with_conditions')) {
            $conditions = app(MedicalConditions::class);

            $rows->each(function (ClinicQueue $row) use ($conditions) {
                $row->setAttribute('condition', $conditions->resolve(
                    $row->endorsement?->diagnosis,
                    $row->endorsement?->icd_10_code,
                ));
            });
        }

        return response()->json($rows);
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
     * Cancel a pending visit from the patient's own portal.
     * Allowed only while the patient has not been seen yet (waiting / triaged)
     * and only within the first 5 minutes after joining the queue. Beyond
     * either point only clinic staff (the nurse) can cancel at the desk.
     */
    public function cancelVisit(Request $request, ClinicQueue $clinicQueue)
    {
        $user = $request->user();

        if ($user->role !== 'patient' || $clinicQueue->patient_id !== $user->user_id) {
            abort(403, 'You can only cancel your own visit.');
        }

        if (in_array($clinicQueue->status, ['done', 'cancelled'], true)) {
            abort(409, 'This visit is already completed or cancelled.');
        }

        if (in_array($clinicQueue->status, ['with-doctor', 'examined'], true)) {
            abort(403, 'This visit is already with the doctor. A nurse can still cancel it at the desk.');
        }

        // The queue has no timestamps, so reconstruct the join moment from the
        // visit date + time_in (both set by the store action, in Asia/Manila).
        $joined = \Carbon\Carbon::createFromFormat('!Y-m-d g:i A', "{$clinicQueue->date} {$clinicQueue->time_in}", 'Asia/Manila');

        if (! $joined || $joined->diffInSeconds(now('Asia/Manila')) > 300) {
            abort(403, 'The 5-minute cancellation window has closed. A nurse can still cancel at the desk.');
        }

        $clinicQueue->update(['status' => 'cancelled']);

        return response()->json($clinicQueue->fresh()->load('patient'));
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