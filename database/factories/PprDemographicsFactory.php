<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PprDemographicFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'civil_status' => 'Single',
            'sex' => $this->faker->randomElement(['Male', 'Female']),
            'birth_date' => '2003-05-14',
            'contact_number' => '09123456789',
            'home_address' => 'Davao City',
            'emergency_contact_name' => 'Maria Dela Cruz',
            'emergency_contact_number' => '09987654321',
        ];
    }
}