<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreQueueRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'patient_id' => 'nullable|exists:users,user_id',
            'visit_type' => 'required|string|max:50',
            'visit_label' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:50',
            'queue_number' => 'nullable|integer',
        ];
    }
}