<?php

namespace Database\Seeders;

use App\Models\PprHealthRecord;
use Illuminate\Database\Seeder;

class PprHealthRecordSeeder extends Seeder
{
    public function run(): void
    {
        PprHealthRecord::factory(3)->create();
    }
}