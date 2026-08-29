<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMedicalCertificateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'endorsed_id' => 'required|exists:endorsed,endorsed_id',
            'purpose' => 'required|string',
            'recommendation' => 'nullable|string',
            'date_issued' => 'nullable|string|max:50',
        ];
    }
}