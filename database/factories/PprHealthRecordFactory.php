<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PprHealthRecordFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'record_type' => 'Consultation Note',
            'description' => 'General physical checkup cleared.',
            'date_recorded' => now()->format('Y-m-d'),
        ];
    }
}