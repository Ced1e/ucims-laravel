<?php

namespace Database\Seeders;

use App\Models\PatientAuth;
use Illuminate\Database\Seeder;

class PatientAuthSeeder extends Seeder
{
    public function run(): void
    {
        PatientAuth::factory(3)->create();
    }
}