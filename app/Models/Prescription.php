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
        // One prescription = one issuance row (enforced by the unique index
        // on prescription_id), so saving the same prescription twice can no
        // longer create a duplicate copy.
        static::created(function (Prescription $prescription) {
            $prescription->syncMedicineIssuance(creating: true);
        });

        // Editing a prescription refreshes the clinical detail on its issuance
        // without overwriting what the nurse recorded when dispensing.
        static::updated(function (Prescription $prescription) {
            $prescription->syncMedicineIssuance(creating: false);
        });

        static::deleted(function (Prescription $prescription) {
            MedicineIssuance::query()
                ->where('prescription_id', $prescription->prescription_id)
                ->delete();

            // Legacy rows created before the prescription link existed have no
            // prescription_id. Match those by visit + medicine name and remove
            // only the newest copy, never a manual dispense from another visit.
            $endorsed = Endorsed::query()->find($prescription->endorsed_id);

            if (! $endorsed?->queue_id) {
                return;
            }

            MedicineIssuance::query()
                ->whereNull('prescription_id')
                ->where('queue_id', $endorsed->queue_id)
                ->where('medicine_name', $prescription->drug_name)
                // Only the old auto-mirrored rows carry this placeholder;
                // never remove a real dispense the nurse recorded.
                ->where('quantity', 'as prescribed')
                ->orderByDesc('issuance_id')
                ->limit(1)
                ->delete();
        });
    }

    private function syncMedicineIssuance(bool $creating): void
    {
        $endorsed = $this->endorsed()->first()
            ?? Endorsed::query()->find($this->endorsed_id);

        if (! $endorsed?->queue_id) {
            return;
        }

        $clinical = [
            'queue_id' => $endorsed->queue_id,
            'medicine_name' => $this->drug_name,
            'dosage' => $this->dosage,
            'frequency' => $this->frequency,
            'duration' => $this->duration,
            'route' => $this->route,
            'instructions' => $this->treatment_instructions,
        ];

        // A prescription is not a dispense: the nurse and the quantity stay
        // untouched until the medicine station actually issues it.
        $issuance = MedicineIssuance::query()->firstOrCreate(
            ['prescription_id' => $this->prescription_id],
            $clinical + [
                'nurse_id' => null,
                'quantity' => 'as prescribed',
                'issued_date' => now(),
            ],
        );

        // On edits, refresh the clinical detail without overwriting the
        // dispense data the nurse recorded.
        if (! $creating && ! $issuance->wasRecentlyCreated) {
            $issuance->update($clinical);
        }
    }
}
