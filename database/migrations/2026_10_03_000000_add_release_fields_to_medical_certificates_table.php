<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medical_certificates', function (Blueprint $table) {
            $table->string('purpose', 255)->nullable()->after('findings');
            $table->string('physician_name', 255)->nullable()->after('purpose');
            $table->string('license_no', 100)->nullable()->after('physician_name');
            $table->string('exam_date', 50)->nullable()->after('license_no');
        });
    }

    public function down(): void
    {
        Schema::table('medical_certificates', function (Blueprint $table) {
            $table->dropColumn(['purpose', 'physician_name', 'license_no', 'exam_date']);
        });
    }
};
