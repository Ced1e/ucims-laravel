<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropForeign(['patient_id']);
            $table->dropColumn('patient_id');

            $table->renameColumn('id', 'consultation_id');
            $table->renameColumn('treatment_plan', 'treatment');

            $table->foreignId('queue_id')
                ->nullable()
                ->after('consultation_id')
                ->constrained('clinic_queue', 'queue_id')
                ->nullOnDelete();

            $table->date('consultation_date')->nullable()->after('doctor_id');
            $table->text('notes')->nullable()->after('treatment');
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropForeign(['queue_id']);
            $table->dropColumn(['queue_id', 'consultation_date', 'notes']);
            $table->renameColumn('consultation_id', 'id');
            $table->renameColumn('treatment', 'treatment_plan');
            $table->unsignedBigInteger('patient_id')->nullable();
            $table->foreign('patient_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }
};