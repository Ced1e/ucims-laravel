<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ConsultationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'diagnosis' => $this->faker->sentence(),
            'treatment' => $this->faker->paragraph(),
            'notes' => $this->faker->text(),
        ];
    }
}