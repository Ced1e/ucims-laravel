<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class RecordController extends Controller
{
    public function getPatients()
    {
        // Fetch all users designated as patients
        $patients = User::where('role', 'patient')->get()->map(function($user) {
            return [
                'id' => $user->user_id,
                'patientId' => $user->student_id,
                'name' => trim($user->firstname . ' ' . $user->lastname),
                'role' => $user->role,
                'email' => $user->usep_email
            ];
        });

        return response()->json(['status' => 'success', 'patients' => $patients]);
    }

    public function getStaff()
    {
        // Fetch all nurses, doctors, and admins
        $staff = User::whereIn('role', ['nurse', 'doctor', 'admin'])->get()->map(function($user) {
            return [
                'id' => $user->user_id,
                'clinicId' => $user->clinic_id,
                'name' => trim($user->firstname . ' ' . $user->lastname),
                'role' => $user->role
            ];
        });

        return response()->json(['status' => 'success', 'staff' => $staff]);
    }
}