<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use App\Models\MedicalCertificate;
use Illuminate\Foundation\Http\FormRequest;

class StoreMedicalCertificateRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Doctors/admins issue; a patient may only request one for his/her own visit.
        return $this->user()?->can('create', [MedicalCertificate::class, $this->input('queue_id')]) ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->user()?->role === 'patient') {
            // A patient requests a certificate; only staff can provide issuance fields.
            // Ignore those fields before conditional release validation is evaluated.
            $this->replace($this->only([
                'queue_id', 'diagnosis_reason', 'date_from', 'date_to', 'additional_notes',
            ]));
        }
    }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'issued_by' => InputRules::actor($this, 'issued_by', ['doctor', 'admin'], null),
            'diagnosis_reason' => 'required|string',
            'additional_notes' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'is_released' => 'boolean',
            'medcert_attach' => 'nullable|string',
            ...InputRules::certificate($this, null),
        ];
    }
}
