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
        Schema::create('staff_profiles', function (Blueprint $table) {
    $table->id('staff_profile_id');
    $table->foreignId('user_id')->unique()->constrained('users', 'user_id')->onDelete('cascade');
    $table->string('sex', 20)->nullable();
    $table->date('dob')->nullable();
    $table->string('mobile_no', 20)->nullable();
    $table->string('landline_no', 20)->nullable();
    $table->string('address_block', 50)->nullable();
    $table->string('address_street', 100)->nullable();
    $table->string('address_brgy', 100)->nullable();
    $table->string('address_city', 100)->nullable();
    $table->string('address_province', 100)->nullable();
    $table->text('role_description')->nullable();
    $table->string('employment_status', 50)->nullable();
    $table->string('schedule', 255)->nullable();
    $table->index('employment_status', 'idx_staff_emp_status');
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_profiles');
    }
};
