<?php

namespace Database\Seeders;

use App\Models\PprPermanent;
use App\Models\User;
use Illuminate\Database\Seeder;

class PprPermanentSeeder extends Seeder
{
    public function run(): void
    {
        $sample = [
            ['patient_type' => 'Student', 'college_dept' => 'College of Information and Computing', 'year_level' => '3rd Year'],
            ['patient_type' => 'Student', 'college_dept' => 'College of Engineering', 'year_level' => '2nd Year'],
            ['patient_type' => 'Faculty', 'college_dept' => 'College of Information and Computing', 'year_level' => 'N/A'],
            ['patient_type' => 'Student', 'college_dept' => 'College of Technology', 'year_level' => '1st Year'],
            ['patient_type' => 'Staff', 'college_dept' => 'Registrar\'s Office', 'year_level' => 'N/A'],
            ['patient_type' => 'Student', 'college_dept' => 'College of Information and Computing', 'year_level' => '4th Year'],
        ];

        User::where('role', 'patient')->get()->each(function ($patient, $i) use ($sample) {
            $s = $sample[$i % count($sample)];
            PprPermanent::updateOrCreate(
                ['patient_id' => $patient->user_id],
                $s
            );
        });
    }
}
