<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalCertificate extends Model
{
    use HasFactory;

    protected $table = 'medical_certificates';
    protected $primaryKey = 'certificate_id';
    public $timestamps = false;

    protected $fillable = [
        'queue_id',
        'issued_by',
        'diagnosis_reason',
        'date_from',
        'date_to',
        'additional_notes',
        'issued_date',
        'is_released',
        'findings',
        'medcert_attach',
        'purpose',
        'physician_name',
        'license_no',
        'exam_date',
    ];

    protected $casts = [
        'issued_date' => 'datetime',
        'is_released' => 'boolean',
    ];

    public function queue()
    {
        return $this->belongsTo(ClinicQueue::class, 'queue_id', 'queue_id');
    }

    public function issuer()
    {
        return $this->belongsTo(User::class, 'issued_by', 'user_id');
    }
}