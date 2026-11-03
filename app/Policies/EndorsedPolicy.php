<?php

namespace App\Policies;

use App\Models\Endorsed;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

/**
 * Endorsements = the nurse hands a patient to a doctor; the doctor then records
 * the examination and diagnosis on the same row.
 */
class EndorsedPolicy
{
    use ChecksRoles;

    public function viewAny(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function view(User $user, Endorsed $endorsed): bool
    {
        return $this->isStaff($user) || $this->ownsQueue($user, $endorsed->queue);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, 'admin', 'doctor', 'nurse');
    }

    public function update(User $user, Endorsed $endorsed): bool
    {
        if ($this->hasRole($user, 'admin')) {
            return true;
        }

        // A doctor may update the endorsements assigned to him/her
        // (or an unassigned one).
        return $this->hasRole($user, 'doctor')
            && ($endorsed->doctor_id === null || (int) $endorsed->doctor_id === (int) $user->user_id);
    }

    public function delete(User $user, Endorsed $endorsed): bool
    {
        return $this->hasRole($user, 'admin');
    }
}
