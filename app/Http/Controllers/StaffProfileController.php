<?php

namespace App\Http\Controllers;

use App\Models\StaffProfile;
use App\Models\StaffAuth;
use App\Http\Requests\StoreStaffProfileRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class StaffProfileController extends Controller
{
    public function index()
    {
        $staff = StaffProfile::with('auth')->orderBy('staff_id', 'desc')->get();
        return Inertia::render('Staff/Index', ['staff' => $staff]);
    }

    public function create()
    {
        return Inertia::render('Staff/Create');
    }

    public function store(StoreStaffProfileRequest $request)
    {
        $profile = StaffProfile::create($request->only(['clinic_id', 'first_name', 'last_name', 'role', 'email']));
        
        StaffAuth::create([
            'staff_id' => $profile->staff_id,
            'password_hash' => Hash::make($request->password_hash),
        ]);

        return redirect()->route('staff.index')->with('success', 'Staff account created.');
    }

    public function edit(StaffProfile $staff)
    {
        return Inertia::render('Staff/Update', ['staff' => $staff]);
    }

    public function update(Request $request, StaffProfile $staff)
    {
        $staff->update($request->only(['first_name', 'last_name', 'role', 'email']));
        
        if ($request->filled('password_hash')) {
            StaffAuth::where('staff_id', $staff->staff_id)->update([
                'password_hash' => Hash::make($request->password_hash)
            ]);
        }

        return redirect()->route('staff.index')->with('success', 'Staff account updated.');
    }

    public function clone(StaffProfile $staff)
    {
        $cloneProfile = $staff->replicate();
        $cloneProfile->clinic_id = 'CLONE-' . rand(100, 999);
        $cloneProfile->save();

        StaffAuth::create([
            'staff_id' => $cloneProfile->staff_id,
            'password_hash' => Hash::make('password'),
        ]);

        return redirect()->route('staff.index')->with('success', 'Staff account cloned.');
    }

    public function destroy(StaffProfile $staff)
    {
        StaffAuth::where('staff_id', $staff->staff_id)->delete();
        $staff->delete();
        return redirect()->route('staff.index')->with('success', 'Staff account deleted.');
    }
}