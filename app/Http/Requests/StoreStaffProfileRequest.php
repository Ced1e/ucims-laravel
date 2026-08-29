<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffProfileRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'clinic_id' => 'required|string|max:50|unique:staff_profiles,clinic_id',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'role' => 'required|string|max:50',
            'email' => 'required|email|max:255|unique:staff_profiles,email',
            'password_hash' => 'required|string',
        ];
    }
}