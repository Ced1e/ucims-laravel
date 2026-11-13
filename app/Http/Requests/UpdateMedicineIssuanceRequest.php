<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use App\Models\MedicineIssuance;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicineIssuanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = $this->route('medicineIssuance');

        return $record instanceof MedicineIssuance
            && ($this->user()?->can('update', $record) ?? false);
    }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'nurse_id' => InputRules::actor($this, 'nurse_id', ['nurse', 'admin'], $this->route('medicineIssuance')),
            'medicine_name' => 'sometimes|string|max:255',
            'dosage' => 'nullable|string|max:100',
            'quantity' => 'nullable|string|max:50',
            'instructions' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'duration' => 'nullable|string|max:100',
            'frequency' => 'nullable|string|max:100',
            'route' => 'nullable|string|max:100',
        ];
    }
}
