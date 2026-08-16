<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links a lamb/kid/calf to the birth record that created it. nullOnDelete
 * is deliberate, not an oversight: deleting a birth record (e.g. to correct
 * a data-entry mistake) must never delete the animals it produced — they
 * may already have their own weight/health history by then. Deleting a
 * birth only detaches this provenance link.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->foreignId('birth_id')->nullable()->after('exit_reason')->constrained('births')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropForeign(['birth_id']);
            $table->dropColumn('birth_id');
        });
    }
};
