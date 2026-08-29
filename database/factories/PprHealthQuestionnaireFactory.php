<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PprHealthQuestionnaireFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'has_allergies' => false,
            'allergy_details' => null,
            'has_maintenance_meds' => false,
            'maintenance_med_details' => null,
            'has_past_surgeries' => false,
            'surgery_details' => null,
            'family_medical_history' => 'None significant',
        ];
    }
}