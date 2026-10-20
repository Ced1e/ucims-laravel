<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Endorsed extends Model
{
    use HasFactory;

    protected $table = 'endorsed';
    protected $primaryKey = 'endorsed_id';
    public $timestamps = false; // Uses database default for created_at

    protected $fillable = [
        'queue_id',
        'doctor_id',
        'exam_general',
        'exam_heent',
        'exam_chest',
        'exam_cardio',
        'exam_abdomen',
        'exam_extremities',
        'exam_neuro',
        'diagnosis',
        'icd_10_code',
        'final_remarks',
        'status',
    ];

    public function queue()
    {
        return $this->belongsTo(ClinicQueue::class, 'queue_id', 'queue_id');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id', 'user_id');
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'endorsed_id', 'endorsed_id');
    }

    public function labRequests()
    {
        return $this->hasMany(LabRequest::class, 'endorsed_id', 'endorsed_id');
    }
}