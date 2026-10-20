<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    use HasFactory;

    protected $table = 'consultations';
    protected $primaryKey = 'consultation_id';
    public $timestamps = false;

    protected $fillable = [
        'queue_id',
        'doctor_id',
        'consultation_date',
        'diagnosis',
        'treatment',
        'notes',
        'status',
    ];

    protected $casts = [
        'consultation_date' => 'date',
    ];

    public function queue()
    {
        return $this->belongsTo(ClinicQueue::class, 'queue_id', 'queue_id');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id', 'user_id');
    }
}