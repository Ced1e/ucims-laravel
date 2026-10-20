<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffProfile extends Model
{
    use HasFactory;

    protected $table = 'staff_profiles';
    protected $primaryKey = 'staff_profile_id';
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'sex',
        'dob',
        'mobile_no',
        'landline_no',
        'address_block',
        'address_street',
        'address_brgy',
        'address_city',
        'address_province',
        'role_description',
        'employment_status',
        'schedule',
    ];

    protected $casts = [
        'dob' => 'date',
    ];

    public function auth()
    {
        return $this->hasOne(StaffAuth::class, 'user_id', 'user_id');
    }

    public function user()
    {
    return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}