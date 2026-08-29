<?php

namespace Database\Seeders;

use App\Models\PprHealthQuestionnaire;
use Illuminate\Database\Seeder;

class PprHealthQuestionnaireSeeder extends Seeder
{
    public function run(): void
    {
        PprHealthQuestionnaire::factory(3)->create();
    }
}