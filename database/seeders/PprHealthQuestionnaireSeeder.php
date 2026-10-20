<?php

namespace Database\Seeders;

use App\Models\PprHealthQuestionnaire;
use App\Models\User;
use Illuminate\Database\Seeder;

class PprHealthQuestionnaireSeeder extends Seeder
{
    public function run(): void
    {
        User::where('role', 'patient')->get()->each(function ($patient, $i) {
            PprHealthQuestionnaire::updateOrCreate(
                ['patient_id' => $patient->user_id],
                [
                    'hosp_admitted' => $i % 3 === 0 ? 'Yes' : 'No',
                    'hosp_illness' => $i % 3 === 0 ? 'Dengue Fever' : null,
                    'hosp_when' => $i % 3 === 0 ? '2024' : null,
                    'surgery' => 'No',
                    'surg_type' => null,
                    'surg_when' => null,
                    'infectious_list' => 'None reported',
                    'syncope' => 'No',
                    'female_menarche' => null,
                    'female_periods_yr' => null,
                    'female_regular' => null,
                    'female_irregular_spec' => null,
                    'female_dysmenorrhea' => null,
                    'female_symptoms' => null,
                ]
            );
        });
    }
}
