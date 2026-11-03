<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePprHealthQuestionnaireRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'unique:ppr_health_questionnaire,patient_id', Rule::exists('users', 'user_id')->where('role', 'patient')],
            'hosp_admitted' => 'nullable|in:Yes,No',
            'hosp_illness' => 'nullable|string|max:255',
            'hosp_when' => 'nullable|string|max:100',
            'surgery' => 'nullable|in:Yes,No',
            'surg_type' => 'nullable|string|max:255',
            'surg_when' => 'nullable|string|max:100',
            'infectious_list' => 'nullable|string',
            'syncope' => 'nullable|in:Yes,No',
            'female_menarche' => 'nullable|string|max:50',
            'female_periods_yr' => 'nullable|string|max:50',
            'female_regular' => 'nullable|in:Yes,No',
            'female_irregular_spec' => 'nullable|string',
            'female_dysmenorrhea' => 'nullable|in:Yes,No',
            'female_symptoms' => 'nullable|string',
        ];
    }
}
