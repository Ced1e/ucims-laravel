<?php

namespace App\Policies;

use App\Models\ClinicQueue;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class ClinicQueuePolicy
{
    use ChecksRoles;

    public function viewAny(User $user): bool
    {
        return $this->isStaff($user) || $this->hasRole($user, 'patient');
    }

    public function view(User $user, ClinicQueue $clinicQueue): bool
    {
        return $this->isStaff($user) || $this->ownsQueue($user, $clinicQueue);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, 'admin', 'nurse', 'patient');
    }

    /**
     * Nurses move patients along the queue, and doctors mark them
     * "examined" / "done" from the consultation screen.
     */
    public function update(User $user, ClinicQueue $clinicQueue): bool
    {
        return $this->hasRole($user, 'admin', 'nurse', 'doctor');
    }

    public function delete(User $user, ClinicQueue $clinicQueue): bool
    {
        return $this->hasRole($user, 'admin');
    }

    /** Endorse a queued patient to a doctor (and list the doctors to pick from). */
    public function endorse(User $user, ?ClinicQueue $clinicQueue = null): bool
    {
        return $this->hasRole($user, 'admin', 'nurse');
    }
}
