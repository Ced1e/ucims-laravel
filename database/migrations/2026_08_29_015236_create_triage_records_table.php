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
        Schema::create('triage_record', function (Blueprint $table) {
    $table->id('triage_id');
    $table->foreignId('queue_id')->unique()->nullable()->constrained('clinic_queue', 'queue_id')->onDelete('cascade');
    $table->foreignId('nurse_id')->nullable()->constrained('users', 'user_id')->onDelete('set null');
    $table->string('blood_pressure', 50)->nullable();
    $table->string('heart_rate', 50)->nullable();
    $table->string('temperature', 50)->nullable();
    $table->string('resp_rate', 50)->nullable();
    $table->string('o2_saturation', 50)->nullable();
    $table->string('weight', 50)->nullable();
    $table->string('height', 50)->nullable();
    $table->text('chief_complaint')->nullable();
    $table->text('initial_notes')->nullable();
    $table->timestamp('created_at')->nullable()->useCurrent();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('triage_records');
    }
};
