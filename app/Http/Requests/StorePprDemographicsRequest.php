<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePprDemographicRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,user_id|unique:ppr_demographics,user_id',
            'civil_status' => 'nullable|string|max:50',
            'sex' => 'nullable|string|max:20',
            'birth_date' => 'nullable|string|max:50',
            'contact_number' => 'nullable|string|max:50',
            'home_address' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_number' => 'nullable|string|max:50',
        ];
    }
}