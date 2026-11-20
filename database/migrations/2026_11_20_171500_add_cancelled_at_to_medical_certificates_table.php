<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medical_certificates', function (Blueprint $table) {
            // A cancelled request leaves the pending list without becoming history.
            $table->timestamp('cancelled_at')->nullable()->after('is_released');
        });
    }

    public function down(): void
    {
        Schema::table('medical_certificates', function (Blueprint $table) {
            $table->dropColumn('cancelled_at');
        });
    }
};
