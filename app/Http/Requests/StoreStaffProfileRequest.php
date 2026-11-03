<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreStaffProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Identity + login (goes on users)
            'clinic_id' => 'required|string|max:50|unique:users,clinic_id',
            'firstname' => InputRules::name('required'),
            'middlename' => InputRules::name('nullable'),
            'lastname' => InputRules::name('required'),
            'usep_email' => 'required|email|max:150|unique:users,usep_email',
            'role' => 'required|in:admin,doctor,nurse',
            'password' => 'required|string|min:8',

            // Profile details (goes on staff_profiles)
            ...InputRules::staffProfile(),
        ];
    }
}
