<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PprHealthRecord extends Model
{
    use HasFactory;

    protected $table = 'ppr_health_records';
    protected $primaryKey = 'hr_id';
    public $timestamps = false;

    protected $fillable = [
        'patient_id',
        'gen_appearance',
        'height',
        'weight',
        'pulse_rate',
        'resp_rate',
        'temp',
        'blood_pressure',
        'cr_rest',
        'cr_activity',
        'infectious_diseases',
        'social_hx',
        'family_hx',
        'sr_skin',
        'sr_lymph',
        'sr_integument',
        'sr_circulatory',
        'sr_endocrine',
        'sr_allergic',
        'sr_heent',
        'sr_mouth',
        'sr_breast',
        'sr_respiratory',
        'sr_cardiovascular',
        'sr_gastrointestinal',
        'sr_genitourinary',
        'sr_psychiatric',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'patient_id', 'user_id');
    }
}