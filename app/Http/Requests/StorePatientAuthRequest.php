<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePatientAuthRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,user_id|unique:patient_auth,user_id',
            'password_hash' => 'required|string',
        ];
    }
}