<?php

namespace Database\Factories;

use App\Models\Endorsed;
use Illuminate\Database\Eloquent\Factories\Factory;

class LabRequestFactory extends Factory
{
    public function definition(): array
    {
        return [
            'endorsed_id' => Endorsed::factory(),
            'test_type' => $this->faker->randomElement(['Complete Blood Count (CBC)', 'Urinalysis', 'Chest X-Ray', 'Fasting Blood Sugar']),
            'notes' => $this->faker->sentence(),
            'result' => 'Pending',
            'status' => 'requested',
        ];
    }
}