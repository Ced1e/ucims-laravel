<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StaffProfile extends Model
{
    use HasFactory;

    protected $table = 'staff_profiles';
    protected $primaryKey = 'staff_id';
    public $timestamps = false;

    protected $guarded = [];

    public function auth()
    {
        return $this->hasOne(StaffAuth::class, 'staff_id', 'staff_id');
    }
}