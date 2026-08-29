<?php

namespace Database\Factories;

use App\Models\Endorsed;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicineIssuanceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'endorsed_id' => Endorsed::factory(),
            'medicine_name' => $this->faker->randomElement(['Paracetamol', 'Mefenamic Acid', 'Cetirizine']),
            'quantity' => 10,
            'date_issued' => now()->format('Y-m-d'),
        ];
    }
}