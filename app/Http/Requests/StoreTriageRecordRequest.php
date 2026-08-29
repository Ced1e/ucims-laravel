<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTriageRecordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'queue_id' => 'required|exists:clinic_queue,queue_id',
            'nurse_id' => 'nullable|exists:users,user_id',
            'blood_pressure' => 'nullable|string|max:50',
            'heart_rate' => 'nullable|string|max:50',
            'temperature' => 'nullable|string|max:50',
            'resp_rate' => 'nullable|string|max:50',
            'o2_saturation' => 'nullable|string|max:50',
            'weight' => 'nullable|string|max:50',
            'height' => 'nullable|string|max:50',
            'chief_complaint' => 'nullable|string',
            'initial_notes' => 'nullable|string',
        ];
    }
}