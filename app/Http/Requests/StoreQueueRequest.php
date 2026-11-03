<?php

namespace App\Http\Requests;

use App\Models\ClinicQueue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQueueRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Role rules live in ClinicQueuePolicy; checked before validation runs.
        return $this->user()?->can('create', ClinicQueue::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['nullable', Rule::exists('users', 'user_id')->where('role', 'patient')],
            'visit_type' => 'required|in:checkup,medicine,follow-up,medcert',
            'visit_label' => 'nullable|string|max:255',
            'status' => 'nullable|in:waiting,triaged,with-doctor,examined,done,cancelled',
            'queue_number' => 'nullable|integer',
        ];
    }
}
