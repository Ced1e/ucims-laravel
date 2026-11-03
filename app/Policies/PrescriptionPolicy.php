<?php

namespace App\Policies;

use App\Models\Prescription;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class PrescriptionPolicy
{
    use ChecksRoles;

    public function viewAny(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function view(User $user, Prescription $prescription): bool
    {
        return $this->isStaff($user)
            || $this->ownsQueue($user, $prescription->endorsed?->queue);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, 'admin', 'doctor');
    }

    public function update(User $user, Prescription $prescription): bool
    {
        return $this->hasRole($user, 'admin', 'doctor');
    }

    public function delete(User $user, Prescription $prescription): bool
    {
        return $this->hasRole($user, 'admin', 'doctor');
    }
}
