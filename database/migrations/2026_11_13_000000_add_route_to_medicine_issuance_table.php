<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the prescription route (e.g. Oral, Topical) so issued medicines
     * mirror the doctor's prescription details.
     */
    public function up(): void
    {
        Schema::table('medicine_issuance', function (Blueprint $table) {
            $table->string('route', 100)->nullable()->after('frequency');
        });
    }

    public function down(): void
    {
        Schema::table('medicine_issuance', function (Blueprint $table) {
            $table->dropColumn('route');
        });
    }
};
