<?php

namespace App\Services;

use App\Models\Animal;
use App\Models\FeedingCost;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The only place feeding_costs rows are ever written. Keeping every
 * transition (opening the first period, closing on a rate change,
 * closing on exit/archive, reopening on restore) behind one class is
 * what guarantees the table can never end up with two open periods or a
 * gap/overlap between consecutive periods for the same animal.
 */
class FeedingCostManager
{
    /**
     * Sets a new daily rate, following the same-day-collapses / otherwise
     * close-and-open state machine. Rejects an effective date earlier
     * than the currently open period's start — that would require
     * rewriting already-elapsed history.
     */
    public function setDailyCost(Animal $animal, float $dailyCost, ?string $effectiveFrom = null): FeedingCost
    {
        $effectiveFrom = $effectiveFrom ?? Carbon::today()->toDateString();

        return DB::transaction(function () use ($animal, $dailyCost, $effectiveFrom) {
            $open = FeedingCost::where('animal_id', $animal->id)->whereNull('effective_until')->first();

            if (!$open) {
                return FeedingCost::create([
                    'animal_id' => $animal->id,
                    'daily_cost' => $dailyCost,
                    'effective_from' => $effectiveFrom,
                    'effective_until' => null,
                ]);
            }

            $openFrom = $open->effective_from->toDateString();

            if ($effectiveFrom < $openFrom) {
                throw ValidationException::withMessages([
                    'effective_from' => "The new cost cannot start before the current period began on {$openFrom}.",
                ]);
            }

            if ($effectiveFrom === $openFrom) {
                $open->update(['daily_cost' => $dailyCost]);

                return $open->fresh();
            }

            $open->update(['effective_until' => Carbon::parse($effectiveFrom)->subDay()->toDateString()]);

            return FeedingCost::create([
                'animal_id' => $animal->id,
                'daily_cost' => $dailyCost,
                'effective_from' => $effectiveFrom,
                'effective_until' => null,
            ]);
        });
    }

    /**
     * Closes the open period (if any) at $asOfDate — used both when an
     * animal exits (permanent) and when it's archived without exiting
     * (paused; see resumeAfterArchive()). No-ops if cost tracking was
     * never enabled for this animal.
     */
    public function closeOpenPeriod(Animal $animal, string $asOfDate): void
    {
        $open = FeedingCost::where('animal_id', $animal->id)->whereNull('effective_until')->first();

        if (!$open) {
            return;
        }

        // A brand-new period opened the same day it's being closed is
        // valid (one accrued day) — never let the close date fall before
        // the period's own start.
        if ($asOfDate < $open->effective_from->toDateString()) {
            $asOfDate = $open->effective_from->toDateString();
        }

        $open->update(['effective_until' => $asOfDate]);
    }

    /**
     * Resumes accrual after an archived (not exited) animal is restored.
     * If it was archived and restored on the same day, reopens that same
     * period rather than creating a same-day duplicate row; otherwise
     * opens a fresh period at $asOfDate carrying forward the last known
     * rate, leaving the archived date range as a genuine gap the total
     * simply never counts. No-ops for an exited animal (exit is a
     * permanent freeze — see Animal::hasExited()) or one that never had
     * feeding-cost tracking enabled.
     */
    public function resumeAfterArchive(Animal $animal, string $asOfDate): void
    {
        if ($animal->hasExited()) {
            return;
        }

        $stillOpen = FeedingCost::where('animal_id', $animal->id)->whereNull('effective_until')->exists();

        if ($stillOpen) {
            return;
        }

        $lastClosed = FeedingCost::where('animal_id', $animal->id)
            ->whereNotNull('effective_until')
            ->orderByDesc('effective_until')
            ->first();

        if (!$lastClosed) {
            return;
        }

        if ($lastClosed->effective_until->toDateString() === $asOfDate) {
            $lastClosed->update(['effective_until' => null]);

            return;
        }

        FeedingCost::create([
            'animal_id' => $animal->id,
            'daily_cost' => $lastClosed->daily_cost,
            'effective_from' => $asOfDate,
            'effective_until' => null,
        ]);
    }
}
