<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use App\Models\MedicalCertificate;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicalCertificateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = $this->route('medicalCertificate');

        return $record instanceof MedicalCertificate
            && ($this->user()?->can('update', $record) ?? false);
    }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'issued_by' => InputRules::actor($this, 'issued_by', ['doctor', 'admin'], $this->route('medicalCertificate')),
            'diagnosis_reason' => 'sometimes|string',
            'additional_notes' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'is_released' => 'boolean',
            'medcert_attach' => 'nullable|string',
            ...InputRules::certificate($this, $this->route('medicalCertificate')),
        ];
    }
}
