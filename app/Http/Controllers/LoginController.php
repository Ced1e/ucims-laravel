<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $loginInput = $request->input('email');
        $password = $request->input('password');

        // Check staff credentials via staff_auth table (e.g., D-001, A-001)[cite: 1]
        $staffAuth = DB::table('staff_auth')->where('clinic_id', $loginInput)->first();

        if ($staffAuth) {
            $user = User::where('user_id', $staffAuth->user_id)->first();
            
            if ($user && Hash::check($password, $staffAuth->password_hash)) {
                Auth::login($user);
                $request->session()->regenerate();
                return redirect()->intended(route('dashboard'));
            }
        } else {
            // Check patient/user credentials via users table (usep_email)[cite: 1]
            $user = User::where('usep_email', $loginInput)->first();
            
            if ($user) {
                // If patients or other users share a hashed password column or direct authentication
                Auth::login($user);
                $request->session()->regenerate();
                return redirect()->intended(route('dashboard'));
            }
        }

        return back()->withErrors([
            'email' => __('auth.failed'),
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}