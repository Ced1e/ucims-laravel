<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffAuth extends Model
{
    use HasFactory;

    protected $table = 'staff_auth';
    protected $primaryKey = 'staff_auth_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'clinic_id',
        'password_hash',
    ];

    public function profile()
    {
        return $this->belongsTo(StaffProfile::class, 'user_id', 'user_id');
    }
}