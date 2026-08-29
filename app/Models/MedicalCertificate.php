<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalCertificate extends Model
{
    use HasFactory;

    protected $table = 'medical_certificates';
    protected $primaryKey = 'cert_id';
    public $timestamps = false;

    protected $guarded = [];

    public function endorsed()
    {
        return $this->belongsTo(Endorsed::class, 'endorsed_id', 'endorsed_id');
    }
}