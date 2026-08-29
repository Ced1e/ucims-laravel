<?php

namespace Database\Seeders;

use App\Models\StaffAuth;
use App\Models\StaffProfile;
use Illuminate\Database\Seeder;

class StaffProfileSeeder extends Seeder
{
    public function run(): void
    {
        StaffAuth::factory(3)->create();
    }
}