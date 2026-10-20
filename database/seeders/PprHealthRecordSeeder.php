<?php

namespace Database\Seeders;

use App\Models\PprHealthRecord;
use App\Models\User;
use Illuminate\Database\Seeder;

class PprHealthRecordSeeder extends Seeder
{
    public function run(): void
    {
        User::where('role', 'patient')->get()->each(function ($patient, $i) {
            PprHealthRecord::updateOrCreate(
                ['patient_id' => $patient->user_id],
                [
                    'gen_appearance' => 'Well-developed, well-nourished, ambulatory, not in distress',
                    'height' => 160 + ($i * 3) . ' cm',
                    'weight' => 55 + ($i * 2) . ' kg',
                    'pulse_rate' => '76 bpm',
                    'resp_rate' => '18 br/min',
                    'temp' => '36.5°C',
                    'blood_pressure' => '110/70',
                    'cr_rest' => '2 sec',
                    'cr_activity' => '2 sec',
                    'infectious_diseases' => 'None reported',
                    'social_hx' => 'Non-smoker, occasional alcohol use',
                    'family_hx' => 'No significant family history reported',
                    'sr_skin' => 'Normal', 'sr_lymph' => 'Normal', 'sr_integument' => 'Normal',
                    'sr_circulatory' => 'Normal', 'sr_endocrine' => 'Normal', 'sr_allergic' => 'None',
                    'sr_heent' => 'Normal', 'sr_mouth' => 'Normal', 'sr_breast' => 'Normal',
                    'sr_respiratory' => 'Normal', 'sr_cardiovascular' => 'Normal', 'sr_gastrointestinal' => 'Normal',
                    'sr_genitourinary' => 'Normal', 'sr_psychiatric' => 'Normal',
                ]
            );
        });
    }
}
