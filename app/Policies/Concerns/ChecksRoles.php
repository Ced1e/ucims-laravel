<?php

namespace App\Policies\Concerns;

use App\Models\ClinicQueue;
use App\Models\User;

/**
 * Small role / ownership helpers shared by the clinical policies.
 *
 * Roles in the `users.role` column: admin, doctor, nurse, patient.
 * "Staff" means anybody working in the clinic (admin, doctor, nurse).
 */
trait ChecksRoles
{
    protected function hasRole(User $user, string ...$roles): bool
    {
        return in_array($user->role, $roles, true);
    }

    protected function isStaff(User $user): bool
    {
        return $this->hasRole($user, 'admin', 'doctor', 'nurse');
    }

    /** True when the visit (queue entry) belongs to this patient. */
    protected function ownsQueue(User $user, ?ClinicQueue $queue): bool
    {
        return $queue !== null && (int) $queue->patient_id === (int) $user->user_id;
    }
}
