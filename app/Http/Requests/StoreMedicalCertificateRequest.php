<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMedicalCertificateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'issued_by' => 'nullable|exists:users,user_id',
            'diagnosis_reason' => 'required|string',
            'date_from' => 'nullable|string|max:50',
            'date_to' => 'nullable|string|max:50',
            'additional_notes' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'is_released' => 'boolean',
            'findings' => 'nullable|string',
            'medcert_attach' => 'nullable|string',
        ];
    }
}