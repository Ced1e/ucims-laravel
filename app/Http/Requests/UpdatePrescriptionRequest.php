<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePrescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = $this->route('prescription');

        return $record instanceof \App\Models\Prescription
            && ($this->user()?->can('update', $record) ?? false);
    }

    public function rules(): array
    {
        return [
            'drug_name' => 'sometimes|string|max:255',
            'dosage' => 'nullable|string|max:100',
            'frequency' => 'nullable|string|max:100',
            'route' => 'nullable|string|max:100',
            'duration' => 'nullable|string|max:100',
            'treatment_instructions' => 'nullable|string',
        ];
    }
}