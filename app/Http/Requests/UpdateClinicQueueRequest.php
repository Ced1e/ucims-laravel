<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClinicQueueRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'visit_type' => 'sometimes|string|max:50',
            'visit_label' => 'nullable|string|max:255',
            'triaged' => 'nullable|boolean',
            'endorsed' => 'nullable|boolean',
            'status' => 'nullable|string|max:50',
            'queue_number' => 'nullable|integer',
            'date' => 'nullable|date',
            'time_in' => 'nullable',
            'time_out' => 'nullable',
        ];
    }
}