<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';
    public $timestamps = false;
    
    protected $fillable = [
        'clinic_id',
        'firstname',
        'middlename',
        'lastname',
        'usep_email',
        'role',
        'password',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Get the name of the unique identifier for the user.
     */
    public function username(): string
    {
        return 'clinic_id';
    }

    public function staffProfile()
    {
    return $this->hasOne(StaffProfile::class, 'user_id', 'user_id');
    }

    public function pprPermanent()
    {
        return $this->hasOne(PprPermanent::class, 'patient_id', 'user_id');
    }

    public function pprDemographic()
    {
        return $this->hasOne(PprDemographic::class, 'patient_id', 'user_id');
    }

    public function pprHealthRecord()
    {
        return $this->hasOne(PprHealthRecord::class, 'patient_id', 'user_id');
    }

    public function pprHealthQuestionnaire()
    {
        return $this->hasOne(PprHealthQuestionnaire::class, 'patient_id', 'user_id');
    }
}