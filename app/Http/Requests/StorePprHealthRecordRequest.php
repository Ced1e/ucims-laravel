<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePprHealthRecordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,user_id',
            'record_type' => 'required|string|max:100',
            'description' => 'nullable|string',
            'date_recorded' => 'nullable|string|max:50',
        ];
    }
}