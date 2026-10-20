<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PprDemographic extends Model
{
    use HasFactory;

    protected $table = 'ppr_demographics';
    protected $primaryKey = 'demographics_id';
    public $timestamps = false;

    protected $fillable = [
        'patient_id',
        'dob',
        'sex',
        'civil_status',
        'religion',
        'birthplace',
        'nationality',
        'city_address',
        'prov_address',
        'contact_no',
        'em_name',
        'em_contact',
        'em_rel',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'patient_id', 'user_id');
    }
}