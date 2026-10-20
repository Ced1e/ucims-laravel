<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePprDemographicRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:users,user_id|unique:ppr_demographics,patient_id',
            'dob' => 'nullable|string|max:50',
            'sex' => 'nullable|string|max:20',
            'civil_status' => 'nullable|string|max:50',
            'religion' => 'nullable|string|max:100',
            'birthplace' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:100',
            'city_address' => 'nullable|string',
            'prov_address' => 'nullable|string',
            'contact_no' => 'nullable|string|max:50',
            'em_name' => 'nullable|string|max:150',
            'em_contact' => 'nullable|string|max:50',
            'em_rel' => 'nullable|string|max:50',
        ];
    }
}