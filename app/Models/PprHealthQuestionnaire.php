<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PprHealthQuestionnaire extends Model
{
    use HasFactory;

    protected $table = 'ppr_health_questionnaires';
    protected $primaryKey = 'questionnaire_id';
    public $timestamps = false;

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}