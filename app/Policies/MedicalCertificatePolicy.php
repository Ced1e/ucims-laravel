<?php

namespace App\Policies;

use App\Models\MedicalCertificate;
use App\Models\User;

class MedicalCertificatePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse', 'patient']);
    }

    public function view(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $user->role === 'admin' || 
               in_array($user->role, ['doctor', 'nurse']) || 
               $user->user_id === optional($medicalCertificate->queue)->patient_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor']);
    }

    public function update(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return in_array($user->role, ['admin', 'doctor']);
    }

    public function delete(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $user->role === 'admin';
    }
}