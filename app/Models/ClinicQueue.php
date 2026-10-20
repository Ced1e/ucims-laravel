<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClinicQueue extends Model
{
    protected $table = 'clinic_queue';
    protected $primaryKey = 'queue_id';
    public $timestamps = false;

    protected $fillable = [
        'patient_id',
        'visit_type',
        'visit_label',
        'triaged',
        'endorsed',
        'status',
        'queue_number',
        'date',
        'time_in',
        'time_out',
    ];

    protected $casts = [
        'triaged' => 'boolean',
        'endorsed' => 'boolean',
    ];

    public function patient() { return $this->belongsTo(User::class, 'patient_id', 'user_id'); }
    public function triage() { return $this->hasOne(TriageRecord::class, 'queue_id', 'queue_id'); }
    public function endorsement() { return $this->hasOne(Endorsed::class, 'queue_id', 'queue_id'); }
    public function medicalCertificate() { return $this->hasOne(MedicalCertificate::class, 'queue_id', 'queue_id'); }
    public function medicineIssuances() { return $this->hasMany(MedicineIssuance::class, 'queue_id', 'queue_id'); }
}