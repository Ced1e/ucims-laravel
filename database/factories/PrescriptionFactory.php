<?php

namespace Database\Factories;

use App\Models\Endorsed;
use Illuminate\Database\Eloquent\Factories\Factory;

class PrescriptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'endorsed_id' => Endorsed::factory(),
            'medicine_name' => $this->faker->randomElement(['Paracetamol 500mg', 'Amoxicillin 500mg', 'Ibuprofen 400mg']),
            'dosage' => '1 tablet',
            'frequency' => '3 times a day',
            'duration' => '5 days',
            'quantity' => 15,
        ];
    }
}