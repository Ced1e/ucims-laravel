<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use App\Models\Consultation;
use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Role rules live in ConsultationPolicy; checked before validation runs.
        return $this->user()?->can('create', Consultation::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'doctor_id' => InputRules::actor($this, 'doctor_id', ['doctor', 'admin'], null),
            'diagnosis' => 'required|string|max:255',
            'treatment' => 'required|string',
            'notes' => 'nullable|string',
            'consultation_date' => 'nullable|date',
        ];
    }
}
