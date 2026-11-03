<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\Concerns\InputRules;
use App\Models\User;
use App\Models\ClinicQueue;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreRecordDeletionRequest;
use App\Models\RecordDeletionRequest;
use Illuminate\Support\Facades\DB;

class RecordController extends Controller
{
    public function getPatients()
    {
        $patients = User::where('role', 'patient')
            ->with(['pprPermanent', 'pprDemographic'])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->user_id,
                    'patientId' => $user->clinic_id,
                    'name' => trim($user->firstname . ' ' . $user->lastname),
                    'email' => $user->usep_email,
                    'patient_type' => $user->pprPermanent->patient_type ?? null,
                    'college_dept' => $user->pprPermanent->college_dept ?? null,
                    'year_level' => $user->pprPermanent->year_level ?? null,
                    'sex' => $user->pprDemographic->sex ?? null,
                ];
            });

        return response()->json(['status' => 'success', 'patients' => $patients]);
    }

    public function getPatientDetail(User $patient)
    {
        $patient->load(['pprPermanent', 'pprDemographic', 'pprHealthRecord', 'pprHealthQuestionnaire']);

        return response()->json(['status' => 'success', 'patient' => $patient]);
    }

    public function getPatientVisits(User $patient)
    {
        $visits = ClinicQueue::with(['triage', 'endorsement.doctor'])
            ->where('patient_id', $patient->user_id)
            ->orderBy('queue_id', 'desc')
            ->get();

        return response()->json(['status' => 'success', 'visits' => $visits]);
    }

    public function getRecordValidation()
    {
        $patients = User::where('role', 'patient')
            ->with(['pprPermanent', 'pprDemographic', 'pprHealthRecord', 'pprHealthQuestionnaire'])
            ->get()
            ->map(function ($user) {
                $modules = [
                    'demographics' => (bool) $user->pprDemographic,
                    'permanent' => (bool) $user->pprPermanent,
                    'health_record' => (bool) $user->pprHealthRecord,
                    'questionnaire' => (bool) $user->pprHealthQuestionnaire,
                ];

                return [
                    'id' => $user->user_id,
                    'patientId' => $user->clinic_id,
                    'name' => trim($user->firstname . ' ' . $user->lastname),
                    'modules' => $modules,
                    'complete' => ! in_array(false, $modules, true),
                ];
            });

        return response()->json([
            'status' => 'success',
            'summary' => [
                'total_patients' => $patients->count(),
                'complete_profiles' => $patients->where('complete', true)->count(),
                'incomplete_profiles' => $patients->where('complete', false)->count(),
                'total_log_entries' => \App\Models\ClinicQueue::count(),
            ],
            'patients' => $patients->values(),
        ]);
    }

    public function updateStaffRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => 'required|in:admin,doctor,nurse',
        ]);

        if ($user->user_id === $request->user()->user_id) {
            return response()->json(['message' => "You can't change your own role."], 422);
        }

        if ($user->role === 'patient') {
            return response()->json(['message' => 'Patient accounts cannot be assigned a staff role here.'], 422);
        }

        $user->update(['role' => $data['role']]);

        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $user->user_id,
                'name' => trim($user->firstname . ' ' . $user->lastname),
                'role' => $user->role,
            ],
        ]);
    }

    public function getStaff()
    {
        $staff = User::whereIn('role', ['nurse', 'doctor', 'admin'])
            ->with('staffProfile')
            ->orderBy('user_id', 'desc')
            ->get()
            ->map(function ($user) {
                $p = $user->staffProfile;

                return [
                    'id' => $user->user_id,
                    'staffProfileId' => $p->staff_profile_id ?? null,
                    'clinicId' => $user->clinic_id,
                    'name' => trim($user->firstname . ' ' . $user->lastname),
                    'firstname' => $user->firstname,
                    'middlename' => $user->middlename,
                    'lastname' => $user->lastname,
                    'email' => $user->usep_email,
                    'role' => $user->role,
                    'is_active' => $user->is_active ?? true,
                    'profile' => [
                        'sex' => $p->sex ?? null,
                        'dob' => $p && $p->dob ? $p->dob->format('Y-m-d') : null,
                        'mobile_no' => $p->mobile_no ?? null,
                        'landline_no' => $p->landline_no ?? null,
                        'address_block' => $p->address_block ?? null,
                        'address_street' => $p->address_street ?? null,
                        'address_brgy' => $p->address_brgy ?? null,
                        'address_city' => $p->address_city ?? null,
                        'address_province' => $p->address_province ?? null,
                        'role_description' => $p->role_description ?? null,
                        'employment_status' => $p->employment_status ?? null,
                        'schedule' => $p->schedule ?? null,
                    ],
                ];
            });

        return response()->json(['status' => 'success', 'staff' => $staff]);
    }

    public function updateStaff(Request $request, User $user)
    {
        if ($user->role === 'patient') {
            return response()->json(['message' => 'Patient accounts cannot be edited here.'], 422);
        }

        $data = $request->validate(array_merge(InputRules::staffProfile(), [
            'firstname' => InputRules::name(),
            'middlename' => InputRules::name('nullable'),
            'lastname' => InputRules::name(),
            'usep_email' => ['required', 'email', 'max:150', Rule::unique('users', 'usep_email')->ignore($user->user_id, 'user_id')],
        ]));

        $user->update(collect($data)->only(['firstname', 'middlename', 'lastname', 'usep_email'])->toArray());

        $user->staffProfile()->updateOrCreate(
            ['user_id' => $user->user_id],
            collect($data)->except(['firstname', 'middlename', 'lastname', 'usep_email'])->toArray()
        );

        return response()->json(['status' => 'success']);
    }

    public function updateStaffPassword(Request $request, User $user)
    {
        if ($user->role === 'patient') {
            return response()->json(['message' => 'Patient accounts cannot be edited here.'], 422);
        }

        $data = $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['status' => 'success']);
    }

    public function updateStaffStatus(Request $request, User $user)
    {
        $data = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        if ($user->user_id === $request->user()->user_id) {
            return response()->json(['message' => "You can't disable your own account."], 422);
        }

        if ($user->role === 'patient') {
            return response()->json(['message' => 'Patient accounts cannot be managed here.'], 422);
        }

        $user->update(['is_active' => $data['is_active']]);

        return response()->json(['status' => 'success', 'is_active' => $user->is_active]);
    }

    /**
     * Log a patient-record deletion request (nurse, doctor, admin).
     * Nothing is deleted here: the request is stored with status "pending" for review.
     */
    public function storeDeletionRequest(StoreRecordDeletionRequest $request)
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data, $request) {
            // Serialize requests for this patient, even when there is no request row yet.
            User::whereKey($data['patient_id'])->lockForUpdate()->firstOrFail();
            $alreadyPending = RecordDeletionRequest::where('patient_id', $data['patient_id'])
                ->where('status', 'pending')
                ->exists();
    
            if ($alreadyPending) {
                return response()->json(['message' => 'A deletion request for this patient is already pending.'], 422);
            }
    
            $deletionRequest = RecordDeletionRequest::create([
                'patient_id' => $data['patient_id'],
                'requested_by' => $request->user()->user_id,
                'reason' => $data['reason'],
                'status' => 'pending',
            ]);
    
            return response()->json([
                'status' => 'success',
                'message' => 'Deletion request submitted.',
                'request_id' => $deletionRequest->request_id,
            ], 201);
        });
    }

    /**
     * Deletion requests: admins see all of them, everyone else only their own.
     */
    public function getDeletionRequests(Request $request)
    {
        $query = RecordDeletionRequest::with([
            'patient:user_id,clinic_id,firstname,lastname',
            'requester:user_id,firstname,lastname',
        ])->orderByDesc('request_id');

        if ($request->user()->role !== 'admin') {
            $query->where('requested_by', $request->user()->user_id);
        }

        $requests = $query->get()->map(fn ($r) => [
            'id' => $r->request_id,
            'patientId' => $r->patient?->clinic_id,
            'patientName' => trim(($r->patient?->firstname ?? '').' '.($r->patient?->lastname ?? '')),
            'requestedBy' => trim(($r->requester?->firstname ?? '').' '.($r->requester?->lastname ?? '')),
            'reason' => $r->reason,
            'status' => $r->status,
            'created_at' => $r->created_at?->toDateTimeString(),
        ]);

        return response()->json(['status' => 'success', 'requests' => $requests]);
    }
}
