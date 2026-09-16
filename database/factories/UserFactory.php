<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'firstname' => $this->faker->firstName(),
            'middlename' => $this->faker->optional()->lastName(),
            'lastname' => $this->faker->lastName(),
            'usep_email' => $this->faker->unique()->safeEmail(),
            'clinic_id' => 'P-' . $this->faker->unique()->numberBetween(100, 999),
            'role' => 'patient',
            'password' => Hash::make('Password123!'),
            'created_at' => now(),
        ];
    }
}
