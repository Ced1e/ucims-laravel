<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePprHealthRecordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:users,user_id',
            'gen_appearance' => 'nullable|string',
            'height' => 'nullable|string|max:20',
            'weight' => 'nullable|string|max:20',
            'pulse_rate' => 'nullable|string|max:20',
            'resp_rate' => 'nullable|string|max:20',
            'temp' => 'nullable|string|max:20',
            'blood_pressure' => 'nullable|string|max:20',
            'cr_rest' => 'nullable|string|max:20',
            'cr_activity' => 'nullable|string|max:20',
            'infectious_diseases' => 'nullable|string',
            'social_hx' => 'nullable|string',
            'family_hx' => 'nullable|string',
            'sr_skin' => 'nullable|string',
            'sr_lymph' => 'nullable|string',
            'sr_integument' => 'nullable|string',
            'sr_circulatory' => 'nullable|string',
            'sr_endocrine' => 'nullable|string',
            'sr_allergic' => 'nullable|string',
            'sr_heent' => 'nullable|string',
            'sr_mouth' => 'nullable|string',
            'sr_breast' => 'nullable|string',
            'sr_respiratory' => 'nullable|string',
            'sr_cardiovascular' => 'nullable|string',
            'sr_gastrointestinal' => 'nullable|string',
            'sr_genitourinary' => 'nullable|string',
            'sr_psychiatric' => 'nullable|string',
        ];
    }
}