<?php

namespace Database\Factories;

use App\Models\Endorsed;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicalCertificateFactory extends Factory
{
    public function definition(): array
    {
        return [
            'endorsed_id' => Endorsed::factory(),
            'purpose' => 'Excused from classes due to viral infection',
            'recommendation' => 'Must rest for 3 days',
            'date_issued' => now()->format('Y-m-d'),
        ];
    }
}