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
        Schema::create('lab_request', function (Blueprint $table) {
    $table->id('lab_request_id');
    $table->foreignId('endorsed_id')->nullable()->constrained('endorsed', 'endorsed_id')->onDelete('cascade');
    $table->string('laboratory_request', 255)->nullable();
    $table->text('attachments')->nullable();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lab_requests');
    }
};
