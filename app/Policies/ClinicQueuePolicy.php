<?php

namespace App\Policies;

use App\Models\ClinicQueue;
use App\Models\User;

class ClinicQueuePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'nurse', 'patient']);
    }

    public function view(User $user, ClinicQueue $clinicQueue): bool
    {
        return $user->role === 'admin' || 
               in_array($user->role, ['doctor', 'nurse']) || 
               $user->user_id === $clinicQueue->patient_id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'nurse', 'patient']);
    }

    public function update(User $user, ClinicQueue $clinicQueue): bool
    {
        return in_array($user->role, ['admin', 'nurse']);
    }

    public function delete(User $user, ClinicQueue $clinicQueue): bool
    {
        return $user->role === 'admin';
    }
}