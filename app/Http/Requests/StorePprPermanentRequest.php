<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePprPermanentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'unique:ppr_permanent,patient_id', Rule::exists('users', 'user_id')->where('role', 'patient')],
            'patient_type' => 'nullable|in:Student,Faculty',
            'college_dept' => 'nullable|string|max:150',
            'year_level' => 'nullable|string|max:50',
        ];
    }
}
