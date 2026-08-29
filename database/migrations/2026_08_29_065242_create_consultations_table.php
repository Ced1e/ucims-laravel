<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('patient_id');
            $table->unsignedBigInteger('doctor_id');
            
            $table->foreign('patient_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('doctor_id')->references('user_id')->on('users')->onDelete('cascade');

            $table->text('diagnosis');
            $table->text('treatment_plan')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('consultations');
    }
};