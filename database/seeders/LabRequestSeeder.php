<?php

namespace Database\Seeders;

use App\Models\LabRequest;
use Illuminate\Database\Seeder;

class LabRequestSeeder extends Seeder
{
    public function run(): void
    {
        LabRequest::factory(5)->create();
    }
}