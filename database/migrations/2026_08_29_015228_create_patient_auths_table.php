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
        Schema::create('patient_auth', function (Blueprint $table) {
    $table->id('patient_auth_id');
    $table->foreignId('user_id')->unique()->nullable()->constrained('users', 'user_id')->onDelete('cascade');
    $table->string('univ_id', 50)->unique();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_auths');
    }
};
