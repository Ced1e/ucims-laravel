<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePprHealthQuestionnaireRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,user_id|unique:ppr_health_questionnaires,user_id',
            'has_allergies' => 'boolean',
            'allergy_details' => 'nullable|string',
            'has_maintenance_meds' => 'boolean',
            'maintenance_med_details' => 'nullable|string',
            'has_past_surgeries' => 'boolean',
            'surgery_details' => 'nullable|string',
            'family_medical_history' => 'nullable|string',
        ];
    }
}