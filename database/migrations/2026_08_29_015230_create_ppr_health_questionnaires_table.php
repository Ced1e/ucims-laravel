<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ppr_health_questionnaire', function (Blueprint $table) {
    $table->id('questionnaire_id');
    $table->foreignId('patient_id')->unique()->nullable()->constrained('users', 'user_id')->onDelete('cascade');
    $table->string('hosp_admitted', 10)->nullable();
    $table->string('hosp_illness', 255)->nullable();
    $table->string('hosp_when', 100)->nullable();
    $table->string('surgery', 10)->nullable();
    $table->string('surg_type', 255)->nullable();
    $table->string('surg_when', 100)->nullable();
    $table->text('infectious_list')->nullable();
    $table->string('syncope', 10)->nullable();
    $table->string('female_menarche', 50)->nullable();
    $table->string('female_periods_yr', 50)->nullable();
    $table->string('female_regular', 10)->nullable();
    $table->text('female_irregular_spec')->nullable();
    $table->string('female_dysmenorrhea', 10)->nullable();
    $table->text('female_symptoms')->nullable();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppr_health_questionnaires');
    }
};
