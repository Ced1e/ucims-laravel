<?php

namespace App\Policies;

use App\Models\LabRequest;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class LabRequestPolicy
{
    use ChecksRoles;

    public function viewAny(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function view(User $user, LabRequest $labRequest): bool
    {
        return $this->isStaff($user)
            || $this->ownsQueue($user, $labRequest->endorsed?->queue);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, 'admin', 'doctor');
    }

    public function update(User $user, LabRequest $labRequest): bool
    {
        return $this->hasRole($user, 'admin', 'doctor');
    }

    public function delete(User $user, LabRequest $labRequest): bool
    {
        return $this->hasRole($user, 'admin', 'doctor');
    }
}
