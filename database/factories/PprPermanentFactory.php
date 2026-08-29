<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PprPermanentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'blood_type' => 'O+',
            'disability_info' => 'None',
            'chronic_conditions' => 'None',
        ];
    }
}