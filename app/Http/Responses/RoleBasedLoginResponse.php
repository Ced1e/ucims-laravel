<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class RoleBasedLoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        $redirect = match ($user->role) {
            'admin' => route('admin.dashboard'),
            'doctor' => route('doctor.dashboard'),
            'nurse' => route('nurse.dashboard'),
            'patient' => route('patient.dashboard'),
            default => route('dashboard'),
        };

        return redirect($redirect);
    }
}