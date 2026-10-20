<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePprHealthQuestionnaireRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:users,user_id|unique:ppr_health_questionnaire,patient_id',
            'hosp_admitted' => 'nullable|boolean',
            'hosp_illness' => 'nullable|string',
            'hosp_when' => 'nullable|string|max:100',
            'surgery' => 'nullable|boolean',
            'surg_type' => 'nullable|string',
            'surg_when' => 'nullable|string|max:100',
            'infectious_list' => 'nullable|string',
            'syncope' => 'nullable|boolean',
            'female_menarche' => 'nullable|string|max:50',
            'female_periods_yr' => 'nullable|string|max:50',
            'female_regular' => 'nullable|boolean',
            'female_irregular_spec' => 'nullable|string',
            'female_dysmenorrhea' => 'nullable|boolean',
            'female_symptoms' => 'nullable|string',
        ];
    }
}