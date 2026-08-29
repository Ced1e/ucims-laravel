<?php

namespace Database\Seeders;

use App\Models\TriageRecord;
use Illuminate\Database\Seeder;

class TriageRecordSeeder extends Seeder
{
    public function run(): void
    {
        TriageRecord::factory(5)->create();
    }
}