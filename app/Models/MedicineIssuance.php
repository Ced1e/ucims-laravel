<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicineIssuance extends Model
{
    use HasFactory;

    protected $table = 'medicine_issuance';

    protected $primaryKey = 'issuance_id';

    public $timestamps = false;

    protected $fillable = [
        'queue_id',
        'prescription_id',
        'nurse_id',
        'medicine_name',
        'dosage',
        'quantity',
        'instructions',
        'issued_date',
        'duration',
        'frequency',
        'route',
    ];

    protected $casts = [
        'issued_date' => 'datetime',
    ];

    public function queue()
    {
        return $this->belongsTo(ClinicQueue::class, 'queue_id', 'queue_id');
    }

    public function nurse()
    {
        return $this->belongsTo(User::class, 'nurse_id', 'user_id');
    }

    public function prescription()
    {
        return $this->belongsTo(Prescription::class, 'prescription_id', 'prescription_id');
    }
}
