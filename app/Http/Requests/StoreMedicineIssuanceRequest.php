<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMedicineIssuanceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'nurse_id' => 'nullable|exists:users,user_id',
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