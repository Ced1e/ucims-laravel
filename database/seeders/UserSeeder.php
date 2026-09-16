<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin
        User::create([
            'firstname' => 'Admin',
            'lastname' => 'Maria',
            'usep_email' => 'admin@usep.edu.ph',
            'clinic_id' => 'A-001',
            'role' => 'admin',
            'password' => Hash::make('Password123!'),
        ]);

        // Create Doctor
        User::create([
            'firstname' => 'Jose',
            'lastname' => 'Cruz',
            'usep_email' => 'doctor@usep.edu.ph',
            'clinic_id' => 'D-001',
            'role' => 'doctor',
            'password' => Hash::make('Password123!'),
        ]);

        // Create Nurse
        User::create([
            'firstname' => 'Rosalyn',
            'lastname' => 'Reyes',
            'usep_email' => 'nurse@usep.edu.ph',
            'clinic_id' => 'N-001',
            'role' => 'nurse',
            'password' => Hash::make('Password123!'),
        ]);

        User::create([
            'firstname' => 'Maria',
            'lastname' => 'Santos',
            'usep_email' => 'patient@usep.edu.ph',
            'clinic_id' => 'P-001',
            'role' => 'patient',
            'password' => Hash::make('Password123!'),
        ]);

        User::factory()->count(5)->create(['role' => 'patient']);
    }
}
