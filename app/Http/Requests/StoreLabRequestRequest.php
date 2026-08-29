<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLabRequestRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'endorsed_id' => 'required|exists:endorsed,endorsed_id',
            'test_type' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'result' => 'nullable|string',
            'status' => 'nullable|string|max:50',
        ];
    }
}