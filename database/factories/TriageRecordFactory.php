<?php

namespace Database\Factories;

use App\Models\ClinicQueue;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TriageRecordFactory extends Factory
{
    public function definition(): array
    {
        return [
            'queue_id' => ClinicQueue::factory(),
            'nurse_id' => User::factory(),
            'blood_pressure' => '120/80',
            'heart_rate' => '78',
            'temperature' => '36.5',
            'resp_rate' => '18',
            'o2_saturation' => '98',
            'weight' => '60',
            'height' => '165',
            'chief_complaint' => $this->faker->sentence(),
            'initial_notes' => $this->faker->paragraph(),
            'created_at' => now(),
        ];
    }
}