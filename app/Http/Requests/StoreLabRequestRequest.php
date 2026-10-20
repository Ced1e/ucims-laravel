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
            'laboratory_request' => 'required|string|max:255',
            'attachments' => 'nullable|string',
        ];
    }
}