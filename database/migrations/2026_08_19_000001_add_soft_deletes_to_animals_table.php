<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Animals with any history (weights, health records, breeding cycles, or
 * being referenced as another animal's dam/sire) are archived rather than
 * deleted — see AnimalController::destroy(). Only an animal with zero
 * history is ever actually removed from the table.
 *
 * The plain `unique(farm_id, tag)` constraint is replaced with a partial
 * index scoped to active rows: without that, archiving a tagged animal
 * would permanently block that tag from ever being reused, since the row
 * (and its tag) still physically exists after a soft delete.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->softDeletes();
            $table->dropUnique(['farm_id', 'tag']);
        });

        DB::statement('CREATE UNIQUE INDEX animals_farm_id_tag_unique ON animals (farm_id, tag) WHERE deleted_at IS NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS animals_farm_id_tag_unique');

        Schema::table('animals', function (Blueprint $table) {
            $table->unique(['farm_id', 'tag']);
            $table->dropSoftDeletes();
        });
    }
};
