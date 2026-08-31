<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $role = $request->input('loginRole');

        // STAFF LOGIN
        if ($role === 'staff') {
            $user = User::where('clinic_id', $request->clinicId)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json(['status' => 'error', 'message' => 'Invalid Clinic ID or password.']);
            }

            Auth::login($user);
            
            return response()->json([
                'status' => 'success',
                'user' => [
                    'id' => $user->user_id,
                    'name' => trim($user->firstname . ' ' . $user->lastname),
                    'role' => $user->role,
                    'clinic_id' => $user->clinic_id
                ]
            ]);
        } 
        
        // PATIENT LOGIN
        if ($role === 'patient') {
            $user = User::where('usep_email', $request->email)
                        ->where('student_id', $request->idNum)
                        ->first();

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'Invalid Email or ID Number.']);
            }

            Auth::login($user);
            
            return response()->json([
                'status' => 'success',
                'user' => [
                    'id' => $user->user_id,
                    'name' => trim($user->firstname . ' ' . $user->lastname),
                    'role' => 'patient',
                    'patient_id' => $user->student_id
                ]
            ]);
        }
    }

    public function check(Request $request)
    {
        if (Auth::check()) {
            $user = Auth::user();
            return response()->json([
                'status' => 'success',
                'user' => [
                    'id' => $user->user_id,
                    'name' => trim($user->firstname . ' ' . $user->lastname),
                    'role' => $user->role,
                    'clinic_id' => $user->clinic_id,
                    'patient_id' => $user->student_id
                ]
            ]);
        }

        return response()->json(['status' => 'error', 'message' => 'No active session']);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return response()->json(['status' => 'success']);
    }

    public function register(Request $request)
    {
        // We will build out the patient registration logic later
        return response()->json(['status' => 'error', 'message' => 'Registration endpoint under construction.']);
    }
}