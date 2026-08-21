<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FarmUpdateRequest;
use App\Models\Animal;
use App\Models\Birth;
use App\Models\BreedingCycle;
use App\Models\Farm;
use App\Models\HealthRecord;
use App\Services\AlertGenerator;
use Illuminate\Http\Request;

class FarmController extends Controller
{
    /**
     * Rename the caller's own farm. There's no farm id in the route —
     * it's always the authenticated user's own farm, same as show().
     */
    public function update(FarmUpdateRequest $request)
    {
        $farm = $request->user()->farm;

        if (!$farm) {
            return response()->json(['error' => 'No farm found for user'], 404);
        }

        $farm->update(['name' => $request->name]);

        return response()->json([
            'id' => $farm->id,
            'name' => $farm->name,
        ]);
    }

    /**
     * Display the user's farm details.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;
        
        if (!$farm) {
            return response()->json(['error' => 'No farm found for user'], 404);
        }

        // Load farm with animals for statistics
        $farm->load('animals');
        
        return response()->json([
            'id' => $farm->id,
            'name' => $farm->name,
            'owner' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'created_at' => $farm->created_at->toISOString(),
            'statistics' => [
                'total_animals' => $farm->animals->count(),
                'by_type' => [
                    'sheep' => $farm->animals->where('type', 'sheep')->count(),
                    'goat' => $farm->animals->where('type', 'goat')->count(),
                    'cow' => $farm->animals->where('type', 'cow')->count(),
                    'camel' => $farm->animals->where('type', 'camel')->count(),
                ],
                'sacrificed_animals' => $farm->animals->where('is_sacrificed', true)->count(),
                'eligible_for_sacrifice' => $farm->animals->filter(function ($animal) {
                    return !$animal->is_sacrificed && $animal->isEligibleForSacrifice();
                })->count(),
                'recently_fed' => $farm->animals->where('fed_at', '>=', now()->subDay())->count(),
                'recently_groomed' => $farm->animals->where('groomed_at', '>=', now()->subDay())->count(),
            ]
        ]);
    }

    /**
     * Get farm statistics summary.
     */
    public function statistics(Request $request, AlertGenerator $alertGenerator)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['error' => 'No farm found for user'], 404);
        }

        $farm->load('animals.breedingCycles');

        return response()->json([
            'farm_name' => $farm->name,
            'total_animals' => $farm->animals->count(),
            'animals_by_type' => [
                'sheep' => $farm->animals->where('type', 'sheep')->count(),
                'goat' => $farm->animals->where('type', 'goat')->count(),
                'cow' => $farm->animals->where('type', 'cow')->count(),
                'camel' => $farm->animals->where('type', 'camel')->count(),
            ],
            'sacrifice_status' => [
                'already_sacrificed' => $farm->animals->where('is_sacrificed', true)->count(),
                'eligible_for_sacrifice' => $farm->animals->filter(function ($animal) {
                    return !$animal->is_sacrificed && $animal->isEligibleForSacrifice();
                })->count(),
                'not_yet_eligible' => $farm->animals->filter(function ($animal) {
                    return !$animal->is_sacrificed && !$animal->isEligibleForSacrifice();
                })->count(),
            ],
            'care_status' => [
                'recently_fed' => $farm->animals->where('fed_at', '>=', now()->subDay())->count(),
                'recently_groomed' => $farm->animals->where('groomed_at', '>=', now()->subDay())->count(),
                'need_feeding' => $farm->animals->filter(function ($animal) {
                    return !$animal->is_sacrificed && (!$animal->fed_at || $animal->fed_at < now()->subDay());
                })->count(),
                'need_grooming' => $farm->animals->filter(function ($animal) {
                    return !$animal->is_sacrificed && (!$animal->groomed_at || $animal->groomed_at < now()->subWeek());
                })->count(),
            ],
            'breeding_status_counts' => $this->breedingStatusCounts($farm),
            'breeding_performance' => $this->breedingPerformance($farm),
            'expense_summary' => $this->expenseSummary($farm),
            'alert_summary' => $this->alertSummary($farm, $alertGenerator),
        ]);
    }

    /**
     * Current flock composition by breeding status — "what does the flock
     * look like right now", so (unlike the historical sections below) it
     * excludes archived animals (via the default SoftDeletes scope on
     * $farm->animals) and sacrificed ones, matching the same exclusion
     * Dashboard.jsx already applies client-side to its pregnant/nursing
     * counts.
     */
    private function breedingStatusCounts(Farm $farm): array
    {
        $counts = ['not_bred' => 0, 'bred' => 0, 'pregnant' => 0, 'nursing' => 0, 'available' => 0];

        foreach ($farm->animals->where('is_sacrificed', false) as $animal) {
            $counts[$animal->breeding_status]++;
        }

        return $counts;
    }

    /**
     * Historical breeding performance — a cycle that already happened is a
     * real fact regardless of whether the dam was later archived, so this
     * deliberately queries Animal::withTrashed() rather than $farm->animals
     * (which, via the SoftDeletes global scope, would silently drop any
     * archived dam's cycles/births even through a whereHas — the same
     * category of gotcha as the Rule::unique() SoftDeletes bug from Step 1).
     */
    private function breedingPerformance(Farm $farm): array
    {
        $animalIds = Animal::withTrashed()->where('farm_id', $farm->id)->pluck('id');

        $cycles = BreedingCycle::whereIn('animal_id', $animalIds)->get(['pregnancy_result', 'birthed_on', 'weaned_on']);
        $births = Birth::whereIn('dam_id', $animalIds)->get(['offspring_alive', 'offspring_total']);

        $byStatus = ['bred' => 0, 'pregnant' => 0, 'not_pregnant' => 0, 'aborted' => 0, 'lambed' => 0];
        foreach ($cycles as $cycle) {
            $byStatus[$cycle->status]++;
        }

        $birthedCycles = $cycles->whereNotNull('birthed_on');
        $weanedCycles = $birthedCycles->whereNotNull('weaned_on');

        return [
            'by_status' => $byStatus,
            'total_births' => $births->count(),
            'total_offspring_alive' => (int) $births->sum('offspring_alive'),
            'total_offspring_total' => (int) $births->sum('offspring_total'),
            'weaning_rate' => $birthedCycles->count() > 0
                ? round($weanedCycles->count() / $birthedCycles->count() * 100, 1)
                : null,
        ];
    }

    /**
     * Historical spending — same archived-still-counts reasoning as
     * breeding performance above: money already spent is real regardless
     * of the animal's current archived status. by_kind omits kinds with
     * no recorded cost, so the frontend chart doesn't render empty slices.
     * by_month always returns exactly 6 entries (oldest to newest), zero-
     * filled for months with no spending, so the frontend can chart it
     * directly without gap-filling itself.
     */
    private function expenseSummary(Farm $farm): array
    {
        $animalIds = Animal::withTrashed()->where('farm_id', $farm->id)->pluck('id');
        $records = HealthRecord::whereIn('animal_id', $animalIds)
            ->whereNotNull('cost')
            ->get(['kind', 'cost', 'administered_on']);

        $byKind = [];
        foreach (HealthRecord::KINDS as $kind) {
            $sum = round((float) $records->where('kind', $kind)->sum('cost'), 2);
            if ($sum > 0) {
                $byKind[$kind] = $sum;
            }
        }

        $byMonth = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $key = $month->format('Y-m');
            $sum = round((float) $records->filter(fn ($r) => $r->administered_on->format('Y-m') === $key)->sum('cost'), 2);
            $byMonth[] = ['month' => $key, 'total' => $sum];
        }

        return [
            'total' => round((float) $records->sum('cost'), 2),
            'by_kind' => $byKind,
            'by_month' => $byMonth,
        ];
    }

    /**
     * Thin wrapper around the existing AlertGenerator, grouped by type —
     * no new alert logic. Excludes dismissed alerts, matching what
     * AlertController::index() actually shows the user.
     */
    private function alertSummary(Farm $farm, AlertGenerator $alertGenerator): array
    {
        $alerts = $alertGenerator->generate($farm);

        $dismissed = $farm->alertDismissals()->pluck('alert_key')->all();
        $alerts = array_filter($alerts, fn ($a) => !in_array($a['key'], $dismissed, true));

        $byType = [
            'breeding_check_due' => 0,
            'lambing_due' => 0,
            'weaning_due' => 0,
            'reinsemination_due' => 0,
            'health_due' => 0,
            'low_stock' => 0,
        ];
        foreach ($alerts as $alert) {
            $byType[$alert['type']]++;
        }

        return [
            'total' => count($alerts),
            'by_type' => $byType,
        ];
    }
} 