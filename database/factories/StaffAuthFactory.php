<?php

namespace Database\Factories;

use App\Models\StaffProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class StaffAuthFactory extends Factory
{
    public function definition(): array
    {
        return [
            'staff_id' => StaffProfile::factory(),
            'password_hash' => Hash::make('password'),
        ];
    }
}