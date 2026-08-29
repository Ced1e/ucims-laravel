<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PatientAuth;
use App\Models\PprDemographic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        // Create user in the main users table
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        // Create corresponding password hash in patient_auth
        PatientAuth::create([
            'user_id' => $user->user_id,
            'password_hash' => Hash::make($request->password),
        ]);

        // Initialize empty PPR demographic record
        PprDemographic::create([
            'user_id' => $user->user_id,
            'civil_status' => 'Single',
            'sex' => 'Not Specified',
        ]);

        Auth::login($user);

        return redirect(route('patient.dashboard', absolute: false));
    }
}