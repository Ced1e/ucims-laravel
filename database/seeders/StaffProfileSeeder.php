<?php

namespace Database\Seeders;

use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Database\Seeder;

class StaffProfileSeeder extends Seeder
{
    public function run(): void
    {
        $descriptions = [
            'admin' => 'Clinic system administrator',
            'doctor' => 'University clinic physician',
            'nurse' => 'University clinic nurse',
        ];

        User::whereIn('role', ['admin', 'doctor', 'nurse'])->get()->each(function ($user, $i) use ($descriptions) {
            StaffProfile::updateOrCreate(
                ['user_id' => $user->user_id],
                [
                    'sex' => $i % 2 === 0 ? 'Male' : 'Female',
                    'dob' => now()->subYears(30 + $i)->format('Y-m-d'),
                    'mobile_no' => '09' . str_pad((string) (190000000 + $i), 9, '0', STR_PAD_LEFT),
                    'address_city' => 'Davao City',
                    'address_province' => 'Davao del Sur',
                    'role_description' => $descriptions[$user->role] ?? null,
                    'employment_status' => 'Full-time',
                    'schedule' => 'Mon-Fri, 8:00 AM - 5:00 PM',
                ]
            );
        });
    }
}
