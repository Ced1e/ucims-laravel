<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecordDeletionRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Same people the legacy Record Management screen was open to.
        return in_array($this->user()?->role, ['nurse', 'doctor', 'admin'], true);
    }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', Rule::exists('users', 'user_id')->where('role', 'patient')],
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
            // Replaces the legacy "Authorization Code" box: the requester re-enters their own password.
            'password' => ['required', 'current_password'],
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.exists' => 'Please select a valid patient.',
            'reason.min' => 'Please give a reason of at least 10 characters.',
            'password.current_password' => 'The authorization password is incorrect.',
        ];
    }
}
