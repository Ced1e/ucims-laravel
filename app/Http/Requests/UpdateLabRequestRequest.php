<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLabRequestRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'endorsed_id' => 'sometimes|exists:endorsed,endorsed_id',
            'laboratory_request' => 'sometimes|string|max:255',
            'attachments' => 'nullable|string',
        ];
    }
}