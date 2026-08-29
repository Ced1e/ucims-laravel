<?php

namespace Database\Seeders;

use App\Models\Endorsed;
use Illuminate\Database\Seeder;

class EndorsedSeeder extends Seeder
{
    public function run(): void
    {
        Endorsed::factory(5)->create();
    }
}