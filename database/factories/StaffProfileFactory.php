<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class StaffProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'clinic_id' => 'D-' . $this->faker->unique()->numberBetween(100, 999),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'role' => 'Doctor',
            'email' => $this->faker->unique()->safeEmail(),
        ];
    }
}