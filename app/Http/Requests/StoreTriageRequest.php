<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use App\Models\TriageRecord;
use Illuminate\Foundation\Http\FormRequest;

class StoreTriageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Role rules live in TriageRecordPolicy; checked before validation runs.
        return $this->user()?->can('create', TriageRecord::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'queue_id' => 'required|exists:clinic_queue,queue_id',
            'nurse_id' => InputRules::actor($this, 'nurse_id', ['nurse', 'admin'], null),
            'blood_pressure' => InputRules::bloodPressure('required'),
            'heart_rate' => InputRules::vital(),
            'temperature' => InputRules::vital(),
            'resp_rate' => InputRules::vital(),
            'o2_saturation' => InputRules::vital(),
            'weight' => InputRules::vital(),
            'height' => InputRules::vital(),
            'chief_complaint' => 'required|required|string',
            'initial_notes' => 'nullable|string',
        ];
    }
}
