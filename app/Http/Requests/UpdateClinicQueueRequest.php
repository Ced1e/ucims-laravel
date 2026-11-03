<?php

namespace App\Http\Requests;

use App\Models\ClinicQueue;
use Illuminate\Foundation\Http\FormRequest;

class UpdateClinicQueueRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = $this->route('clinicQueue');

        return $record instanceof ClinicQueue
            && ($this->user()?->can('update', $record) ?? false);
    }

    public function rules(): array
    {
        return [
            'visit_type' => 'sometimes|in:checkup,medicine,follow-up,medcert',
            'visit_label' => 'nullable|string|max:255',
            'triaged' => 'nullable|boolean',
            'endorsed' => 'nullable|boolean',
            'status' => 'nullable|in:waiting,triaged,with-doctor,examined,done,cancelled',
            'queue_number' => 'nullable|integer',
            'date' => 'nullable|date',
            'time_in' => 'nullable|string|max:50',
            'time_out' => 'nullable|string|max:50',
        ];
    }
}
