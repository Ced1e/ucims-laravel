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
        Schema::table('record_deletion_requests', function (Blueprint $table) {
            $table->string('patient_clinic_id')->nullable()->after('patient_id');
            $table->string('patient_name')->nullable()->after('patient_clinic_id');
            $table->text('review_notes')->nullable()->after('status');
            $table->unsignedBigInteger('patient_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('record_deletion_requests', function (Blueprint $table) {
            $table->dropColumn(['patient_clinic_id', 'patient_name', 'review_notes']);
        });
    }
};
