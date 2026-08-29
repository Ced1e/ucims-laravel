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
        Schema::create('ppr_permanent', function (Blueprint $table) {
    $table->id('permanent_id');
    $table->foreignId('patient_id')->unique()->nullable()->constrained('users', 'user_id')->onDelete('cascade');
    $table->string('patient_type', 50)->nullable();
    $table->string('college_dept', 150)->nullable();
    $table->string('year_level', 50)->nullable();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppr_permanents');
    }
};
