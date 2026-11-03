<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Audit log of patient-record deletion requests.
     *
     * The legacy "Record Deletion" screen only collected a patient, a reason and an
     * authorization code and then showed "Deletion request submitted". Nothing was
     * ever deleted. This table keeps that request on file so it can be reviewed.
     * No patient data is removed by creating a row here.
     */
    public function up(): void
    {
        Schema::create('record_deletion_requests', function (Blueprint $table) {
            $table->id('request_id');
            $table->foreignId('patient_id')->constrained('users', 'user_id')->onDelete('cascade');
            $table->foreignId('requested_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->text('reason');
            $table->string('status', 20)->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('record_deletion_requests');
    }
};
