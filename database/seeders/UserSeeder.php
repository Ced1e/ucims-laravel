<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Safe to run repeatedly: the four named test accounts are created or
     * refreshed (matched by email), and random patients are only added until
     * there are 6 patients in total.
     */
    public function run(): void
    {
        $accounts = [
            ['firstname' => 'Admin', 'lastname' => 'Maria', 'usep_email' => 'admin@usep.edu.ph', 'clinic_id' => 'A-001', 'role' => 'admin'],
            ['firstname' => 'Jose', 'lastname' => 'Cruz', 'usep_email' => 'doctor@usep.edu.ph', 'clinic_id' => 'D-001', 'role' => 'doctor'],
            ['firstname' => 'Rosalyn', 'lastname' => 'Reyes', 'usep_email' => 'nurse@usep.edu.ph', 'clinic_id' => 'N-001', 'role' => 'nurse'],
            ['firstname' => 'Maria', 'lastname' => 'Santos', 'usep_email' => 'patient@usep.edu.ph', 'clinic_id' => 'P-001', 'role' => 'patient'],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['usep_email' => $account['usep_email']],
                $account + ['password' => Hash::make('Password123!')]
            );
        }

        $missing = 6 - User::where('role', 'patient')->count();
        if ($missing > 0) {
            User::factory()->count($missing)->create(['role' => 'patient']);
        }
    }
}
