<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use App\Models\TriageRecord;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateTriageRecordRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $record = $this->route('triageRecord');

        return $record instanceof TriageRecord
            && ($this->user()?->can('update', $record) ?? false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // The scaffold returned [] here, so validated() was always empty and an
        // update silently saved nothing. Same fields as the API triage form.
        return [
            'queue_id' => 'sometimes|exists:clinic_queue,queue_id',
            'nurse_id' => InputRules::actor($this, 'nurse_id', ['nurse', 'admin'], $this->route('triageRecord')),
            'blood_pressure' => InputRules::bloodPressure('sometimes'),
            'heart_rate' => InputRules::vital(),
            'temperature' => InputRules::vital(),
            'resp_rate' => InputRules::vital(),
            'o2_saturation' => InputRules::vital(),
            'weight' => InputRules::vital(),
            'height' => InputRules::vital(),
            'chief_complaint' => 'sometimes|required|string',
            'initial_notes' => 'nullable|string',
        ];
    }
}
