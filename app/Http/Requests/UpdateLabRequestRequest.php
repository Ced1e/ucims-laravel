<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLabRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = $this->route('labRequest');

        return $record instanceof \App\Models\LabRequest
            && ($this->user()?->can('update', $record) ?? false);
    }

    public function rules(): array
    {
        return [
            'endorsed_id' => 'sometimes|exists:endorsed,endorsed_id',
            'laboratory_request' => 'sometimes|string|max:255',
            'attachments' => 'nullable|string',
        ];
    }
}