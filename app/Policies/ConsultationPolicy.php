<?php

namespace App\Policies;

use App\Models\Consultation;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class ConsultationPolicy
{
    use ChecksRoles;

    public function viewAny(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function view(User $user, Consultation $consultation): bool
    {
        return $this->isStaff($user) || $this->ownsQueue($user, $consultation->queue);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, 'admin', 'doctor');
    }

    public function update(User $user, Consultation $consultation): bool
    {
        return $this->hasRole($user, 'admin', 'doctor');
    }

    public function delete(User $user, Consultation $consultation): bool
    {
        return $this->hasRole($user, 'admin');
    }
}
