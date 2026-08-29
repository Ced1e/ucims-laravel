<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class PatientAuthFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'password_hash' => Hash::make('password'),
        ];
    }
}