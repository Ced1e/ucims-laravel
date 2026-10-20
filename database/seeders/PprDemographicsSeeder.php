<?php

namespace Database\Seeders;

use App\Models\PprDemographic;
use App\Models\User;
use Illuminate\Database\Seeder;

class PprDemographicsSeeder extends Seeder
{
    public function run(): void
    {
        $sample = [
            ['sex' => 'Female', 'civil_status' => 'Single', 'religion' => 'Roman Catholic', 'nationality' => 'Filipino'],
            ['sex' => 'Male', 'civil_status' => 'Single', 'religion' => 'Roman Catholic', 'nationality' => 'Filipino'],
            ['sex' => 'Female', 'civil_status' => 'Single', 'religion' => 'Islam', 'nationality' => 'Filipino'],
            ['sex' => 'Male', 'civil_status' => 'Married', 'religion' => 'Iglesia ni Cristo', 'nationality' => 'Filipino'],
            ['sex' => 'Female', 'civil_status' => 'Single', 'religion' => 'Baptist', 'nationality' => 'Filipino'],
            ['sex' => 'Male', 'civil_status' => 'Single', 'religion' => 'Roman Catholic', 'nationality' => 'Filipino'],
        ];

        User::where('role', 'patient')->get()->each(function ($patient, $i) use ($sample) {
            $s = $sample[$i % count($sample)];
            PprDemographic::updateOrCreate(
                ['patient_id' => $patient->user_id],
                [
                    'dob' => now()->subYears(19 + $i)->format('Y-m-d'),
                    'sex' => $s['sex'],
                    'civil_status' => $s['civil_status'],
                    'religion' => $s['religion'],
                    'birthplace' => 'Davao City',
                    'nationality' => $s['nationality'],
                    'city_address' => 'Bo. Obrero, Davao City',
                    'prov_address' => 'Davao del Sur',
                    'contact_no' => '09' . str_pad((string) (170000000 + $i), 9, '0', STR_PAD_LEFT),
                    'em_name' => 'Parent of ' . $patient->firstname,
                    'em_contact' => '09' . str_pad((string) (180000000 + $i), 9, '0', STR_PAD_LEFT),
                    'em_rel' => 'Parent',
                ]
            );
        });
    }
}
