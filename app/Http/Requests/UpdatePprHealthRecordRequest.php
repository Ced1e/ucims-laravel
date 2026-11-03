<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\InputRules;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePprHealthRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'gen_appearance' => 'nullable|string',
            'height' => InputRules::measurement('cm'),
            'weight' => InputRules::measurement('kg'),
            'pulse_rate' => InputRules::vital(20),
            'resp_rate' => InputRules::vital(20),
            'temp' => InputRules::vital(20),
            'blood_pressure' => InputRules::bloodPressure('nullable', 20),
            'cr_rest' => InputRules::vital(20),
            'cr_activity' => InputRules::vital(20),
            'infectious_diseases' => 'nullable|string',
            'social_hx' => 'nullable|string',
            'family_hx' => 'nullable|string',
            'sr_skin' => 'nullable|string|max:100',
            'sr_lymph' => 'nullable|string|max:100',
            'sr_integument' => 'nullable|string|max:100',
            'sr_circulatory' => 'nullable|string|max:100',
            'sr_endocrine' => 'nullable|string|max:100',
            'sr_allergic' => 'nullable|string|max:100',
            'sr_heent' => 'nullable|string|max:100',
            'sr_mouth' => 'nullable|string|max:100',
            'sr_breast' => 'nullable|string|max:100',
            'sr_respiratory' => 'nullable|string|max:100',
            'sr_cardiovascular' => 'nullable|string|max:100',
            'sr_gastrointestinal' => 'nullable|string|max:100',
            'sr_genitourinary' => 'nullable|string|max:100',
            'sr_psychiatric' => 'nullable|string|max:100',
        ];
    }
}
