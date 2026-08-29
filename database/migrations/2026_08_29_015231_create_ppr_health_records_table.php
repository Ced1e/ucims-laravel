<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ppr_health_records', function (Blueprint $table) {
            $table->id('hr_id');
            $table->foreignId('patient_id')->unique()->nullable()->constrained('users', 'user_id')->onDelete('cascade');
            $table->text('gen_appearance')->nullable();
            $table->string('height', 20)->nullable();
            $table->string('weight', 20)->nullable();
            $table->string('pulse_rate', 20)->nullable();
            $table->string('resp_rate', 20)->nullable();
            $table->string('temp', 20)->nullable();
            $table->string('blood_pressure', 20)->nullable();
            $table->string('cr_rest', 20)->nullable();
            $table->string('cr_activity', 20)->nullable();
            $table->text('infectious_diseases')->nullable();
            $table->text('social_hx')->nullable();
            $table->text('family_hx')->nullable();
            $table->string('sr_skin', 100)->nullable();
            $table->string('sr_lymph', 100)->nullable();
            $table->string('sr_integument', 100)->nullable();
            $table->string('sr_circulatory', 100)->nullable();
            $table->string('sr_endocrine', 100)->nullable();
            $table->string('sr_allergic', 100)->nullable();
            $table->string('sr_heent', 100)->nullable();
            $table->string('sr_mouth', 100)->nullable();
            $table->string('sr_breast', 100)->nullable();
            $table->string('sr_respiratory', 100)->nullable();
            $table->string('sr_cardiovascular', 100)->nullable();
            $table->string('sr_gastrointestinal', 100)->nullable();
            $table->string('sr_genitourinary', 100)->nullable();
            $table->string('sr_psychiatric', 100)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppr_health_records');
    }
};