<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientAuthRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'unique:patient_auth,user_id', Rule::exists('users', 'user_id')->where('role', 'patient')],
            'univ_id' => 'required|string|max:50|unique:patient_auth,univ_id',
            'password_hash' => 'required|string|min:8',
        ];
    }
}
