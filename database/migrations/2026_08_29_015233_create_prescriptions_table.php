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
        Schema::create('prescriptions', function (Blueprint $table) {
    $table->id('prescription_id');
    $table->foreignId('endorsed_id')->nullable()->constrained('endorsed', 'endorsed_id')->onDelete('cascade');
    $table->string('drug_name', 255)->nullable();
    $table->string('dosage', 100)->nullable();
    $table->string('frequency', 100)->nullable();
    $table->string('route', 100)->nullable();
    $table->string('duration', 100)->nullable();
    $table->text('treatment_instructions')->nullable();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescriptions');
    }
};
