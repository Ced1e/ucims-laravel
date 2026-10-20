<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicalCertificateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'issued_by' => 'nullable|exists:users,user_id',
            'diagnosis_reason' => 'sometimes|string',
            'date_from' => 'nullable|string|max:50',
            'date_to' => 'nullable|string|max:50',
            'additional_notes' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'is_released' => 'boolean',
            'findings' => 'nullable|string',
            'medcert_attach' => 'nullable|string',
            'purpose' => 'nullable|string|max:255',
            'physician_name' => 'nullable|string|max:255',
            'license_no' => 'nullable|string|max:100',
            'exam_date' => 'nullable|string|max:50',
        ];
    }
}