<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $staff = $this->route('staff');

        return [
            'firstname' => InputRules::name('sometimes'),
            'middlename' => InputRules::name('nullable'),
            'lastname' => InputRules::name('sometimes'),
            'usep_email' => [...InputRules::usepEmail('sometimes'), Rule::unique('users', 'usep_email')->ignore($staff?->user_id, 'user_id')],
            'role' => 'sometimes|in:admin,doctor,nurse',
            'password' => 'nullable|string|min:8',

            ...InputRules::staffProfile(),
        ];
    }
}
