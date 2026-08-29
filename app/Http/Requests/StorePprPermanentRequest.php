<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePprPermanentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,user_id|unique:ppr_permanents,user_id',
            'blood_type' => 'nullable|string|max:10',
            'disability_info' => 'nullable|string',
            'chronic_conditions' => 'nullable|string',
        ];
    }
}