<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Link every auto-created issuance to the prescription it mirrors.
     *
     * Before this, the link was implicit (queue + drug name + whoever was
     * signed in), so saving a prescription more than once could leave the
     * previous issuance behind and create a second copy. A unique index on
     * prescription_id makes "one issuance per prescription" a database rule.
     */
    public function up(): void
    {
        Schema::table('medicine_issuance', function (Blueprint $table) {
            $table->foreignId('prescription_id')
                ->nullable()
                ->unique()
                ->after('queue_id')
                ->constrained('prescriptions', 'prescription_id')
                ->cascadeOnDelete();
        });

        $this->removeExactDuplicates();
    }

    public function down(): void
    {
        Schema::table('medicine_issuance', function (Blueprint $table) {
            $table->dropUnique(['prescription_id']);
            $table->dropConstrainedForeignId('prescription_id');
        });
    }

    /**
     * Clean up rows that were already duplicated: same visit, same medicine,
     * same dosage/frequency/duration/route/instructions. The oldest row is
     * kept so the original issuance date survives.
     */
    private function removeExactDuplicates(): void
    {
        $columns = [
            'queue_id',
            'medicine_name',
            'dosage',
            'frequency',
            'duration',
            'route',
            'instructions',
        ];

        $groups = DB::table('medicine_issuance')
            ->select($columns)
            ->selectRaw('MIN(issuance_id) as keep_id')
            ->groupBy($columns)
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($groups as $group) {
            $query = DB::table('medicine_issuance')->where('issuance_id', '<>', $group->keep_id);

            foreach ($columns as $column) {
                $value = $group->{$column};

                if ($value === null) {
                    $query->whereNull($column);
                } else {
                    $query->where($column, $value);
                }
            }

            $query->delete();
        }
    }
};
