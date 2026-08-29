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
        Schema::create('ppr_demographics', function (Blueprint $table) {
    $table->id('demographics_id');
    $table->foreignId('patient_id')->unique()->nullable()->constrained('users', 'user_id')->onDelete('cascade');
    $table->string('dob', 50)->nullable();
    $table->string('sex', 20)->nullable();
    $table->string('civil_status', 50)->nullable();
    $table->string('religion', 100)->nullable();
    $table->string('birthplace', 255)->nullable();
    $table->string('nationality', 100)->nullable();
    $table->text('city_address')->nullable();
    $table->text('prov_address')->nullable();
    $table->string('contact_no', 50)->nullable();
    $table->string('em_name', 150)->nullable();
    $table->string('em_contact', 50)->nullable();
    $table->string('em_rel', 50)->nullable();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppr_demographics');
    }
};
