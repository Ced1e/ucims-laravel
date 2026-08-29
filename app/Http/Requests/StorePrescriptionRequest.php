<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'endorsed_id' => 'required|exists:endorsed,endorsed_id',
            'medicine_name' => 'required|string|max:255',
            'dosage' => 'nullable|string|max:100',
            'frequency' => 'nullable|string|max:100',
            'duration' => 'nullable|string|max:100',
            'quantity' => 'nullable|integer',
        ];
    }
}