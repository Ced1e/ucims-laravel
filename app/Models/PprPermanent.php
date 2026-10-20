<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PprPermanent extends Model
{
    use HasFactory;

    protected $table = 'ppr_permanent';
    protected $primaryKey = 'permanent_id';
    public $timestamps = false;

    protected $fillable = [
        'patient_id',
        'patient_type',
        'college_dept',
        'year_level',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'patient_id', 'user_id');
    }
}