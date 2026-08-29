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
        Schema::create('endorsed', function (Blueprint $table) {
    $table->id('endorsed_id');
    $table->foreignId('queue_id')->unique()->constrained('clinic_queue', 'queue_id')->onDelete('cascade');
    $table->foreignId('doctor_id')->nullable()->constrained('users', 'user_id')->onDelete('set null');
    $table->text('exam_general')->nullable();
    $table->text('exam_heent')->nullable();
    $table->text('exam_chest')->nullable();
    $table->text('exam_cardio')->nullable();
    $table->text('exam_abdomen')->nullable();
    $table->text('exam_extremities')->nullable();
    $table->text('exam_neuro')->nullable();
    $table->text('diagnosis')->nullable();
    $table->string('icd_10_code', 100)->nullable();
    $table->text('final_remarks')->nullable();
    $table->string('status', 50)->nullable();
    $table->timestamp('created_at')->nullable()->useCurrent();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('endorseds');
    }
};
