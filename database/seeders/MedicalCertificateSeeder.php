<?php

namespace Database\Seeders;

use App\Models\MedicalCertificate;
use Illuminate\Database\Seeder;

class MedicalCertificateSeeder extends Seeder
{
    public function run(): void
    {
        MedicalCertificate::factory(5)->create();
    }
}