<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use App\Models\MedicineIssuance;
use Illuminate\Foundation\Http\FormRequest;

class StoreMedicineIssuanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Role rules live in MedicineIssuancePolicy; checked before validation runs.
        return $this->user()?->can('create', MedicineIssuance::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'nurse_id' => InputRules::actor($this, 'nurse_id', ['nurse', 'admin'], null),
            'medicine_name' => 'required|string|max:255',
            'dosage' => 'nullable|string|max:100',
            'quantity' => 'nullable|string|max:50',
            'instructions' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'duration' => 'nullable|string|max:100',
            'frequency' => 'nullable|string|max:100',
        ];
    }
}
