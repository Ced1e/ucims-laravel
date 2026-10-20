<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEndorsedRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'queue_id' => 'required|exists:clinic_queue,queue_id|unique:endorsed,queue_id',
            'doctor_id' => 'nullable|exists:users,user_id',
            'exam_general' => 'nullable|string',
            'exam_heent' => 'nullable|string',
            'exam_chest' => 'nullable|string',
            'exam_cardio' => 'nullable|string',
            'exam_abdomen' => 'nullable|string',
            'exam_extremities' => 'nullable|string',
            'exam_neuro' => 'nullable|string',
            'diagnosis' => 'required|string',
            'icd_10_code' => 'nullable|string|max:100',
            'final_remarks' => 'nullable|string',
            'status' => 'nullable|string|max:50',
        ];
    }
}