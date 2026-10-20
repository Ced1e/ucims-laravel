<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            // Identity + login (goes on users)
            'clinic_id' => 'required|string|max:50|unique:users,clinic_id',
            'firstname' => 'required|string|max:100',
            'middlename' => 'nullable|string|max:100',
            'lastname' => 'required|string|max:100',
            'usep_email' => 'required|email|max:255|unique:users,usep_email',
            'role' => 'required|in:admin,doctor,nurse',
            'password' => 'required|string|min:8',

            // Profile details (goes on staff_profiles)
            'sex' => 'nullable|string|max:20',
            'dob' => 'nullable|date',
            'mobile_no' => 'nullable|string|max:20',
            'landline_no' => 'nullable|string|max:20',
            'address_block' => 'nullable|string|max:50',
            'address_street' => 'nullable|string|max:100',
            'address_brgy' => 'nullable|string|max:100',
            'address_city' => 'nullable|string|max:100',
            'address_province' => 'nullable|string|max:100',
            'role_description' => 'nullable|string',
            'employment_status' => 'nullable|string|max:50',
            'schedule' => 'nullable|string|max:255',
        ];
    }
}