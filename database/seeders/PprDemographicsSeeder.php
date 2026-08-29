<?php

namespace Database\Seeders;

use App\Models\PprDemographic;
use Illuminate\Database\Seeder;

class PprDemographicSeeder extends Seeder
{
    public function run(): void
    {
        PprDemographic::factory(3)->create();
    }
}