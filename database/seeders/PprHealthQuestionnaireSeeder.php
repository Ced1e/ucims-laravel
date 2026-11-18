<?php

namespace Database\Seeders;

use App\Models\PprDemographic;
use App\Models\PprHealthQuestionnaire;
use App\Models\User;
use Illuminate\Database\Seeder;

class PprHealthQuestionnaireSeeder extends Seeder
{
    public function run(): void
    {
        $femaleDemographics = PprDemographic::where('sex', 'Female')
            ->pluck('patient_id')
            ->all();

        User::where('role', 'patient')->get()->each(function ($patient, $i) use ($femaleDemographics) {
            $isFemale = in_array($patient->user_id, $femaleDemographics, true);

            $profile = [
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
            ];

            if ($isFemale) {
                $profile = array_merge($profile, [
                    'female_menarche' => $i % 2 === 0 ? '13' : '12',
                    'female_periods_yr' => '12',
                    'female_regular' => $i % 3 === 1 ? 'No' : 'Yes',
                    'female_irregular_spec' => $i % 3 === 1 ? 'Occasional 3-day delay' : null,
                    'female_dysmenorrhea' => $i % 4 === 2 ? 'Yes' : 'No',
                ]);
            }

            PprHealthQuestionnaire::updateOrCreate(
                ['patient_id' => $patient->user_id],
                $profile
            );
        });
    }
}
