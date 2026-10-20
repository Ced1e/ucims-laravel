<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePprPermanentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:users,user_id|unique:ppr_permanent,patient_id',
            'patient_type' => 'nullable|string|max:100',
            'college_dept' => 'nullable|string|max:150',
            'year_level' => 'nullable|string|max:50',
        ];
    }
}