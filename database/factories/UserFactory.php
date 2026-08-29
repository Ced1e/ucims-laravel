<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'firstname' => $this->faker->firstName(),
            'middlename' => $this->faker->optional()->lastName(),
            'lastname' => $this->faker->lastName(),
            'usep_email' => $this->faker->unique()->safeEmail(),
            'role' => 'patient',
            'created_at' => now(),
        ];
    }
}