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
        Schema::create('medical_certificates', function (Blueprint $table) {
    $table->id('certificate_id');
    $table->foreignId('queue_id')->nullable()->constrained('clinic_queue', 'queue_id')->onDelete('cascade');
    $table->foreignId('issued_by')->nullable()->constrained('users', 'user_id')->onDelete('set null');
    $table->text('diagnosis_reason')->nullable();
    $table->string('date_from', 50)->nullable();
    $table->string('date_to', 50)->nullable();
    $table->text('additional_notes')->nullable();
    $table->timestamp('issued_date')->nullable()->useCurrent();
    $table->boolean('is_released')->default(false);
    $table->text('findings')->nullable();
    $table->text('medcert_attach')->nullable();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_certificates');
    }
};
