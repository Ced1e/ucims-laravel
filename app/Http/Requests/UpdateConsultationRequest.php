<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use App\Models\Consultation;
use Illuminate\Foundation\Http\FormRequest;

class UpdateConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = $this->route('consultation');

        return $record instanceof Consultation
            && ($this->user()?->can('update', $record) ?? false);
    }

    public function rules(): array
    {
        return [
            'queue_id' => 'nullable|exists:clinic_queue,queue_id',
            'doctor_id' => InputRules::actor($this, 'doctor_id', ['doctor', 'admin'], $this->route('consultation')),
            'diagnosis' => 'required|string|max:255',
            'treatment' => 'required|string',
            'notes' => 'nullable|string',
            'consultation_date' => 'nullable|date',
        ];
    }
}
