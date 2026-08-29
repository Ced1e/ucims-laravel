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
    ];

    protected $hidden = [
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
}