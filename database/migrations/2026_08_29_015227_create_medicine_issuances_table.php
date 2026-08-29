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
        Schema::create('medicine_issuance', function (Blueprint $table) {
    $table->id('issuance_id');
    $table->foreignId('queue_id')->nullable()->constrained('clinic_queue', 'queue_id')->onDelete('cascade');
    $table->foreignId('nurse_id')->nullable()->constrained('users', 'user_id')->onDelete('set null');
    $table->string('medicine_name', 255)->nullable();
    $table->string('dosage', 100)->nullable();
    $table->string('quantity', 50)->nullable();
    $table->text('instructions')->nullable();
    $table->timestamp('issued_date')->nullable()->useCurrent();
    $table->string('duration', 100)->nullable();
    $table->string('frequency', 100)->nullable();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicine_issuances');
    }
};
