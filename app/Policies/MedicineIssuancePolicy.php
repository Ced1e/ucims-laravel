<?php

namespace App\Policies;

use App\Models\MedicineIssuance;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

/** Medicine handed out by the nurse after the consultation. */
class MedicineIssuancePolicy
{
    use ChecksRoles;

    public function viewAny(User $user): bool
    {
        return $this->isStaff($user);
    }

    public function view(User $user, MedicineIssuance $medicineIssuance): bool
    {
        return $this->isStaff($user) || $this->ownsQueue($user, $medicineIssuance->queue);
    }

    public function create(User $user): bool
    {
        return $this->hasRole($user, 'admin', 'nurse');
    }

    public function update(User $user, MedicineIssuance $medicineIssuance): bool
    {
        return $this->hasRole($user, 'admin', 'nurse');
    }

    public function delete(User $user, MedicineIssuance $medicineIssuance): bool
    {
        return $this->hasRole($user, 'admin');
    }
}
