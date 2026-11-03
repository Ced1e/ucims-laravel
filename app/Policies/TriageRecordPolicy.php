<?php

namespace App\Policies;

use App\Models\TriageRecord;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

/** Vitals / chief complaint taken by the nurse. */
class TriageRecordPolicy
{
    use ChecksRoles;

    public function viewAny(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function view(User $user, TriageRecord $triageRecord): bool
    {
        return $this->isStaff($user) || $this->ownsQueue($user, $triageRecord->queue);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, 'admin', 'nurse');
    }

    public function update(User $user, TriageRecord $triageRecord): bool
    {
        return $this->hasRole($user, 'admin', 'nurse');
    }

    public function delete(User $user, TriageRecord $triageRecord): bool
    {
        return $this->hasRole($user, 'admin');
    }
}
