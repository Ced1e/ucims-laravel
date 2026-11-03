<?php

namespace App\Policies;

use App\Models\ClinicQueue;
use App\Models\MedicalCertificate;
use App\Models\User;
use App\Policies\Concerns\ChecksRoles;

class MedicalCertificatePolicy
{
    use ChecksRoles;

    public function viewAny(User $user): bool
    {
        // Patients may call the list, but the controller narrows it to their own.
        return $this->isStaff($user) || $this->hasRole($user, 'patient');
    }

    public function view(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $this->isStaff($user) || $this->ownsQueue($user, $medicalCertificate->queue);
    }

    /**
     * Doctors/admins issue certificates. A patient may only *request* one, and
     * only for his/her own visit: pass the queue id as the second argument,
     * e.g. Gate::authorize('create', [MedicalCertificate::class, $queueId]).
     */
    public function create(User $user, int|string|null $queueId = null): bool
    {
        if ($this->hasRole($user, 'admin', 'doctor')) {
            return true;
        }

        if ($this->hasRole($user, 'patient') && $queueId) {
            return $this->ownsQueue($user, ClinicQueue::find($queueId));
        }

        return false;
    }

    public function update(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $this->hasRole($user, 'admin', 'doctor');
    }

    public function delete(User $user, MedicalCertificate $medicalCertificate): bool
    {
        return $this->hasRole($user, 'admin');
    }
}
