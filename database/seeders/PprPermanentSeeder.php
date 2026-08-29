<?php

namespace Database\Seeders;

use App\Models\PprPermanent;
use Illuminate\Database\Seeder;

class PprPermanentSeeder extends Seeder
{
    public function run(): void
    {
        PprPermanent::factory(3)->create();
    }
}