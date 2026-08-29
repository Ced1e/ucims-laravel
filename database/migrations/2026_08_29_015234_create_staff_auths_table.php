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
        Schema::create('staff_auth', function (Blueprint $table) {
    $table->id('staff_auth_id');
    $table->foreignId('user_id')->unique()->nullable()->constrained('users', 'user_id')->onDelete('cascade');
    $table->string('clinic_id', 50)->unique();
    $table->string('password_hash', 255);
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_auths');
    }
};
