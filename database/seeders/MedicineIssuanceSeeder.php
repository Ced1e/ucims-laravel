<?php

namespace Database\Seeders;

use App\Models\MedicineIssuance;
use Illuminate\Database\Seeder;

class MedicineIssuanceSeeder extends Seeder
{
    public function run(): void
    {
        MedicineIssuance::factory(5)->create();
    }
}