<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin
        User::create([
            'firstname' => 'Admin',
            'lastname' => 'Maria',
            'usep_email' => 'admin@usep.edu.ph',
            'role' => 'admin',
        ]);

        // Create Doctor
        User::create([
            'firstname' => 'Jose',
            'lastname' => 'Cruz',
            'usep_email' => 'doctor@usep.edu.ph',
            'role' => 'doctor',
        ]);

        // Create Nurse
        User::create([
            'firstname' => 'Rosalyn',
            'lastname' => 'Reyes',
            'usep_email' => 'nurse@usep.edu.ph',
            'role' => 'nurse',
        ]);

        // Generate fake patient records using the factory
        User::factory()->count(5)->create(['role' => 'patient']);
    }
}