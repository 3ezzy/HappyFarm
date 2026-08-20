<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `farm_id` NULL = a seeded/global breed, visible to every farm and not
 * editable or deletable through the farm-scoped breed endpoints. Non-null
 * = a custom breed owned by that farm.
 *
 * The plain `unique(['farm_id', 'species', 'name'])` constraint is enough
 * to stop one farm from creating the same custom breed twice, but Postgres
 * (and SQLite) treat NULL as distinct in composite unique constraints, so
 * it would not stop duplicate global rows. A partial unique index closes
 * that gap — same pattern as the tag-reuse-after-archive partial index
 * added for animals in Step 1.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('breeds', function (Blueprint $table) {
            $table->foreignId('farm_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        Schema::table('breeds', function (Blueprint $table) {
            $table->dropUnique(['species', 'name']);
            $table->unique(['farm_id', 'species', 'name']);
        });

        DB::statement('CREATE UNIQUE INDEX breeds_global_species_name_unique ON breeds (species, name) WHERE farm_id IS NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS breeds_global_species_name_unique');

        Schema::table('breeds', function (Blueprint $table) {
            $table->dropUnique(['farm_id', 'species', 'name']);
            $table->unique(['species', 'name']);
        });

        Schema::table('breeds', function (Blueprint $table) {
            $table->dropForeign(['farm_id']);
            $table->dropColumn('farm_id');
        });
    }
};
