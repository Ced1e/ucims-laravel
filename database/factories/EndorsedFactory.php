<?php

namespace Database\Factories;

use App\Models\ClinicQueue;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EndorsedFactory extends Factory
{
    public function definition(): array
    {
        return [
            'queue_id' => ClinicQueue::factory(),
            'doctor_id' => User::factory(),
            'exam_general' => 'Normal appearance',
            'exam_heent' => 'Unremarkable',
            'exam_chest' => 'Clear breath sounds',
            'exam_cardio' => 'S1/S2 normal',
            'exam_abdomen' => 'Soft, non-tender',
            'exam_extremities' => 'No edema',
            'exam_neuro' => 'Intact',
            'diagnosis' => $this->faker->sentence(),
            'icd_10_code' => 'J00',
            'final_remarks' => 'Rest for 2 days',
            'status' => 'completed',
            'created_at' => now(),
        ];
    }
}