<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use App\Models\TriageRecord;
use Illuminate\Foundation\Http\FormRequest;

class StoreTriageRecordRequest extends FormRequest
{
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
            'heart_rate' => InputRules::vital(20, 'nullable', 30, 220),
            'temperature' => InputRules::vital(20, 'nullable', 30, 45),
            'resp_rate' => InputRules::vital(20, 'nullable', 5, 60),
            'o2_saturation' => InputRules::vital(20, 'nullable', 0, 100),
            'weight' => InputRules::vital(20, 'nullable', 10, 300),
            'height' => InputRules::vital(20, 'nullable', 50, 250),
            'chief_complaint' => 'required|required|string',
            'initial_notes' => 'nullable|string',
        ];
    }
}
