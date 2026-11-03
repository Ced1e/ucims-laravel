<?php

namespace App\Http\Requests;

use App\Models\Endorsed;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEndorsedRequest extends FormRequest
{
    public function authorize(): bool
    {
        $record = $this->route('endorsed');

        return $record instanceof Endorsed
            && ($this->user()?->can('update', $record) ?? false);
    }

    public function rules(): array
    {
        return [
            'queue_id' => ['sometimes', 'required', 'integer', 'exists:clinic_queue,queue_id', Rule::in([$this->route('endorsed')?->queue_id])],
            'doctor_id' => ['sometimes', 'required', 'integer', Rule::exists('users', 'user_id')->where('role', 'doctor'), Rule::in([$this->route('endorsed')?->doctor_id])],
            'exam_general' => 'nullable|string',
            'exam_heent' => 'nullable|string',
            'exam_chest' => 'nullable|string',
            'exam_cardio' => 'nullable|string',
            'exam_abdomen' => 'nullable|string',
            'exam_extremities' => 'nullable|string',
            'exam_neuro' => 'nullable|string',
            'diagnosis' => 'sometimes|string',
            'icd_10_code' => 'nullable|string|max:100',
            'final_remarks' => 'nullable|string',
            'status' => 'nullable|string|max:50',
        ];
    }
}
