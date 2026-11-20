<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role', 50);
            $table->string('permission', 100);
            $table->boolean('is_granted')->default(false);
            $table->timestamps();

            $table->unique(['role', 'permission']);
        });

        // Seed default role permissions for account_deletion
        $now = now();
        DB::table('role_permissions')->insert([
            ['role' => 'admin', 'permission' => 'account_deletion', 'is_granted' => true, 'created_at' => $now, 'updated_at' => $now],
            ['role' => 'doctor', 'permission' => 'account_deletion', 'is_granted' => false, 'created_at' => $now, 'updated_at' => $now],
            ['role' => 'nurse', 'permission' => 'account_deletion', 'is_granted' => false, 'created_at' => $now, 'updated_at' => $now],
            ['role' => 'patient', 'permission' => 'account_deletion', 'is_granted' => false, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};
