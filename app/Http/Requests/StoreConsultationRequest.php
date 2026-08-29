<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:queues,id',
            'doctor_id' => 'nullable|exists:users,id',
            'diagnosis' => 'required|string|max:255',
            'treatment' => 'required|string',
            'notes' => 'nullable|string',
            'consultation_date' => 'nullable|date',
        ];
    }
}