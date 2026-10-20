<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $staff = $this->route('staff');

        return [
            'firstname' => 'sometimes|string|max:100',
            'middlename' => 'nullable|string|max:100',
            'lastname' => 'sometimes|string|max:100',
            'usep_email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'usep_email')->ignore($staff?->user_id, 'user_id')],
            'role' => 'sometimes|in:admin,doctor,nurse',
            'password' => 'nullable|string|min:8',

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