<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PprHealthQuestionnaire extends Model
{
    use HasFactory;

    protected $table = 'ppr_health_questionnaire';
    protected $primaryKey = 'questionnaire_id';
    public $timestamps = false;

    protected $fillable = [
        'patient_id',
        'hosp_admitted',
        'hosp_illness',
        'hosp_when',
        'surgery',
        'surg_type',
        'surg_when',
        'infectious_list',
        'syncope',
        'female_menarche',
        'female_periods_yr',
        'female_regular',
        'female_irregular_spec',
        'female_dysmenorrhea',
        'female_symptoms',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'patient_id', 'user_id');
    }
}