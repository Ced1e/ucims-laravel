<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePatientAuthRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'univ_id' => 'sometimes|string|max:50',
            'password_hash' => 'nullable|string|min:8',
        ];
    }
}