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
    {Schema::create('clinic_queue', function (Blueprint $table) {
    $table->id('queue_id');
    $table->foreignId('patient_id')->nullable()->constrained('users', 'user_id')->onDelete('cascade');
    $table->string('visit_type', 50)->nullable();
    $table->string('visit_label', 255)->nullable();
    $table->boolean('triaged')->default(false);
    $table->boolean('endorsed')->default(false);
    $table->string('status', 50)->nullable();
    $table->integer('queue_number')->nullable();
    $table->string('date', 50)->nullable();
    $table->string('time_in', 50)->nullable();
    $table->string('time_out', 50)->nullable();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_queues');
    }
};
