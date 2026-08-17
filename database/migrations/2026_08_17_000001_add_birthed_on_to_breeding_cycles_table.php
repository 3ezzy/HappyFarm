<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `birthed_on` mirrors the date of whichever Birth this cycle culminated
 * in — kept independent of the `births` row itself so that deleting a
 * birth's log entry (offspring count, difficulty, notes: details the user
 * is explicitly allowed to remove) can never make the cycle's derived
 * status/alerts forget a birth actually happened. Without this, deleting
 * a birth made BreedingCycle::status fall back to `pregnancy_result`
 * (still 'pregnant', since birth never changes it) and re-opened
 * lambing_due/breeding_check_due — the animals survived, correctly, but
 * the cycle's own history didn't.
 *
 * See App\Models\Birth::boot() for how this stays in sync on create/
 * update, and BreedingCycle::getStatusAttribute() /
 * getExpectedWeaningOnAttribute() for where it replaces the old reliance
 * on the (deletable) `birth` relation. Deliberately never cleared by
 * Birth::destroy() — that's the entire point of it existing.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('breeding_cycles', function (Blueprint $table) {
            $table->date('birthed_on')->nullable()->after('pregnancy_result');
        });

        // Backfill: cycles that already have a birth on record get the
        // mirror populated retroactively, not just cycles going forward.
        DB::table('births')
            ->whereNotNull('breeding_cycle_id')
            ->orderBy('id')
            ->get(['breeding_cycle_id', 'born_on'])
            ->each(function ($birth) {
                DB::table('breeding_cycles')
                    ->where('id', $birth->breeding_cycle_id)
                    ->update(['birthed_on' => $birth->born_on]);
            });
    }

    public function down(): void
    {
        Schema::table('breeding_cycles', function (Blueprint $table) {
            $table->dropColumn('birthed_on');
        });
    }
};
