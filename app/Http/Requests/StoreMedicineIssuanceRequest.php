<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMedicineIssuanceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'endorsed_id' => 'required|exists:endorsed,endorsed_id',
            'medicine_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'date_issued' => 'nullable|string|max:50',
        ];
    }
}