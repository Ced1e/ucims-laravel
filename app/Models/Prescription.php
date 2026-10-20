<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    use HasFactory;

    protected $table = 'prescriptions';
    protected $primaryKey = 'prescription_id';
    public $timestamps = false;

    protected $fillable = [
        'endorsed_id',
        'drug_name',
        'dosage',
        'frequency',
        'route',
        'duration',
        'treatment_instructions',
    ];

    public function endorsed()
    {
        return $this->belongsTo(Endorsed::class, 'endorsed_id', 'endorsed_id');
    }

    protected static function booted(): void
    {
        // Doctor prescriptions must appear on the nurse Medicine Issuance
        // list so the station can dispense what was recommended in consult.
        static::created(function (Prescription $prescription) {
            $endorsed = $prescription->endorsed()->first()
                ?? Endorsed::query()->find($prescription->endorsed_id);

            if (! $endorsed?->queue_id) {
                return;
            }

            MedicineIssuance::create([
                'queue_id' => $endorsed->queue_id,
                'nurse_id' => auth()->id(),
                'medicine_name' => $prescription->drug_name,
                'dosage' => $prescription->dosage,
                'quantity' => 'as prescribed',
                'frequency' => $prescription->frequency,
                'duration' => $prescription->duration,
                'instructions' => $prescription->treatment_instructions,
                'issued_date' => now(),
            ]);
        });

        static::deleted(function (Prescription $prescription) {
            $endorsed = Endorsed::query()->find($prescription->endorsed_id);

            if (! $endorsed?->queue_id) {
                return;
            }

            MedicineIssuance::query()
                ->where('queue_id', $endorsed->queue_id)
                ->where('medicine_name', $prescription->drug_name)
                ->where('nurse_id', auth()->id())
                ->orderByDesc('issuance_id')
                ->limit(1)
                ->delete();
        });
    }
}