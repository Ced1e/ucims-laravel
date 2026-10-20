<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'doctor_id' => 'nullable|exists:users,user_id',
            'diagnosis' => 'required|string|max:255',
            'treatment' => 'required|string',
            'notes' => 'nullable|string',
            'consultation_date' => 'nullable|date',
        ];
    }
}