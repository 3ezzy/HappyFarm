<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FeedingCostRequest;
use App\Models\Animal;
use App\Models\FeedingCost;
use App\Services\FeedingCostManager;
use Illuminate\Http\Request;

class FeedingCostController extends Controller
{
    /**
     * List an animal's feeding-cost periods, most recent first, each
     * with its accrued day count and subtotal pre-computed server-side.
     */
    public function index(Request $request, $animalId)
    {
        // withTrashed: archiving means read-only, not invisible — see
        // WeightController::index() for the same reasoning. store() below
        // keeps the default, so writes stay blocked for an archived animal.
        $animal = $this->findOwnedAnimal($request, $animalId, withTrashed: true);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        $periods = $animal->feedingCosts()->orderByDesc('effective_from')->get();

        return response()->json($periods->map(fn ($period) => $this->present($period)));
    }

    /**
     * Set (or change) an animal's daily feeding cost. All the
     * open/close-period mechanics live in FeedingCostManager — this
     * action only checks ownership and lifecycle eligibility.
     */
    public function store(FeedingCostRequest $request, $animalId, FeedingCostManager $feedingCosts)
    {
        $animal = $this->findOwnedAnimal($request, $animalId);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        if ($animal->hasExited()) {
            return response()->json(['error' => 'Cannot change the feeding cost of an animal that has left the flock'], 400);
        }

        $period = $feedingCosts->setDailyCost(
            $animal,
            (float) $request->validated('daily_cost'),
            $request->validated('effective_from')
        );

        return response()->json($this->present($period), 201);
    }

    private function findOwnedAnimal(Request $request, $animalId, bool $withTrashed = false): ?Animal
    {
        $user = $request->user();

        $query = Animal::whereHas('farm', fn ($q) => $q->where('user_id', $user->id));

        if ($withTrashed) {
            $query->withTrashed();
        }

        return $query->find($animalId);
    }

    private function present(FeedingCost $period): array
    {
        return [
            'id' => $period->id,
            'animal_id' => $period->animal_id,
            'daily_cost' => (float) $period->daily_cost,
            'effective_from' => $period->effective_from->toDateString(),
            'effective_until' => $period->effective_until?->toDateString(),
            'days' => $period->daysAccrued(),
            'subtotal' => $period->costAccrued(),
        ];
    }
}
