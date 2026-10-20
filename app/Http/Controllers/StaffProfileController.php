<?php

namespace App\Http\Controllers;

use App\Models\StaffProfile;
use App\Models\User;
use App\Http\Requests\StoreStaffProfileRequest;
use App\Http\Requests\UpdateStaffProfileRequest;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use App\Actions\CloneRecordAction;

class StaffProfileController extends Controller
{
    public function index()
    {
        $staff = StaffProfile::with('user')->orderBy('staff_profile_id', 'desc')->get();
        return Inertia::render('Staff/Index', ['staff' => $staff]);
    }

    public function create()
    {
        return Inertia::render('Staff/Create');
    }

    public function store(StoreStaffProfileRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'clinic_id' => $data['clinic_id'],
            'firstname' => $data['firstname'],
            'middlename' => $data['middlename'] ?? null,
            'lastname' => $data['lastname'],
            'usep_email' => $data['usep_email'],
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
        ]);

        $profile = $user->staffProfile()->create(
            collect($data)->only([
                'sex', 'dob', 'mobile_no', 'landline_no', 'address_block',
                'address_street', 'address_brgy', 'address_city', 'address_province',
                'role_description', 'employment_status', 'schedule',
            ])->toArray()
        );

        if ($request->wantsJson()) {
            return response()->json($profile->load('user'), 201);
        }

        return redirect()->route('staff.index')->with('success', 'Staff account created.');
    }

    public function edit(StaffProfile $staff)
    {
        return Inertia::render('Staff/Update', ['staff' => $staff->load('user')]);
    }

    public function update(UpdateStaffProfileRequest $request, StaffProfile $staff)
    {
        $data = $request->validated();

        $userUpdates = collect($data)
            ->only(['firstname', 'middlename', 'lastname', 'usep_email', 'role'])
            ->filter(fn ($value) => $value !== null)
            ->toArray();

        if (! empty($data['password'])) {
            $userUpdates['password'] = Hash::make($data['password']);
        }

        if (! empty($userUpdates)) {
            $staff->user->update($userUpdates);
        }

        $staff->update(
            collect($data)->only([
                'sex', 'dob', 'mobile_no', 'landline_no', 'address_block',
                'address_street', 'address_brgy', 'address_city', 'address_province',
                'role_description', 'employment_status', 'schedule',
            ])->toArray()
        );

        if ($request->wantsJson()) {
            return response()->json($staff->fresh()->load('user'));
        }

        return redirect()->route('staff.index')->with('success', 'Staff account updated.');
    }

    public function clone(StaffProfile $staff, CloneRecordAction $cloner)
    {
        $newUser = $cloner->execute($staff->user, [
            'clinic_id' => 'CLONE-'.rand(1000, 9999),
            'usep_email' => 'clone'.rand(1000, 9999).'@usep.edu.ph',
            'password' => Hash::make('password'),
        ]);

        $cloner->execute($staff, ['user_id' => $newUser->user_id]);

        return redirect()->route('staff.index')->with('success', 'Staff account cloned.');
    }

    public function destroy(StaffProfile $staff)
    {
        // "Disable" must never permanently delete a staff member: their name is
        // linked to triage records, issuances and certificates. Deactivate instead.
        $staff->user->update(['is_active' => false]);

        return redirect()->route('staff.index')->with('success', 'Staff account disabled.');
    }
}