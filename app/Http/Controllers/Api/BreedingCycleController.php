<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BreedingCycleRequest;
use App\Models\Animal;
use App\Models\BreedingCycle;
use Illuminate\Http\Request;

class BreedingCycleController extends Controller
{
    /**
     * List a dam's breeding cycles, most recent first.
     */
    public function index(Request $request, $animalId)
    {
        $dam = $this->findOwnedAnimal($request, $animalId);

        if (!$dam) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        $cycles = $dam->breedingCycles()->with(['sire', 'birth'])->orderByDesc('bred_on')->get();

        return response()->json($cycles->map(fn ($c) => $this->present($c)));
    }

    /**
     * Start a new breeding cycle for a dam.
     */
    public function store(BreedingCycleRequest $request, $animalId)
    {
        $dam = $this->findOwnedAnimal($request, $animalId);

        if (!$dam) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        if ($dam->sex !== 'female') {
            return response()->json(['error' => 'Only female animals can be bred'], 400);
        }

        if ($this->hasOpenCycle($dam)) {
            return response()->json(['error' => 'This animal already has an open breeding cycle'], 400);
        }

        $cycle = BreedingCycle::create([
            'animal_id' => $dam->id,
            'sire_id' => $request->sire_id,
            'method' => $request->method,
            'bred_on' => $request->bred_on,
            'notes' => $request->notes,
        ]);

        // Same class of bug as AnimalController::store() in Phase 1: the
        // in-memory model after create() doesn't reflect the DB-level
        // default (pregnancy_result='pending') that was never explicitly
        // assigned. Refresh before presenting.
        $cycle->refresh();
        $cycle->load(['sire', 'birth']);

        return response()->json($this->present($cycle), 201);
    }

    /**
     * Edit a cycle's original fields (sire/method/date/notes). Pregnancy
     * result and weaning are only ever set via their dedicated actions
     * below, never through this endpoint.
     */
    public function update(BreedingCycleRequest $request, $id)
    {
        $cycle = $this->findOwnedCycle($request, $id);

        if (!$cycle) {
            return response()->json(['error' => 'Breeding cycle not found'], 404);
        }

        $cycle->update([
            'sire_id' => $request->sire_id,
            'method' => $request->method,
            'bred_on' => $request->bred_on,
            'notes' => $request->notes,
        ]);

        $cycle->load(['sire', 'birth']);

        return response()->json($this->present($cycle));
    }

    public function destroy(Request $request, $id)
    {
        $cycle = $this->findOwnedCycle($request, $id);

        if (!$cycle) {
            return response()->json(['error' => 'Breeding cycle not found'], 404);
        }

        $cycle->delete();

        return response()->json(['message' => 'Breeding cycle deleted']);
    }

    /**
     * Record a pregnancy check result.
     */
    public function pregnancyCheck(Request $request, $id)
    {
        $cycle = $this->findOwnedCycle($request, $id);

        if (!$cycle) {
            return response()->json(['error' => 'Breeding cycle not found'], 404);
        }

        $validated = $request->validate([
            'result' => 'required|in:pregnant,not_pregnant,aborted',
            'checked_on' => 'required|date|before_or_equal:today|after_or_equal:' . $cycle->bred_on->toDateString(),
        ]);

        $cycle->update([
            'pregnancy_result' => $validated['result'],
            'pregnancy_check_on' => $validated['checked_on'],
        ]);

        $cycle->load(['sire', 'birth']);

        return response()->json($this->present($cycle));
    }

    /**
     * Record a weaning date. Requires a linked birth — a cycle with no
     * recorded birth has nothing to wean.
     */
    public function wean(Request $request, $id)
    {
        $cycle = $this->findOwnedCycle($request, $id);

        if (!$cycle) {
            return response()->json(['error' => 'Breeding cycle not found'], 404);
        }

        if (!$cycle->birth) {
            return response()->json(['error' => 'Cannot wean a cycle with no recorded birth'], 400);
        }

        $validated = $request->validate([
            'weaned_on' => 'required|date|before_or_equal:today|after_or_equal:' . $cycle->birth->born_on->toDateString(),
        ]);

        $cycle->update(['weaned_on' => $validated['weaned_on']]);
        $cycle->load(['sire', 'birth']);

        return response()->json($this->present($cycle));
    }

    /**
     * An "open" cycle has no linked birth and hasn't been resolved to
     * not_pregnant/aborted — starting a second cycle while one is open
     * would make "the current cycle" ambiguous everywhere else that reads
     * breeding_status.
     */
    private function hasOpenCycle(Animal $dam): bool
    {
        return $dam->breedingCycles()
            ->whereIn('pregnancy_result', ['pending', 'pregnant'])
            ->whereDoesntHave('birth')
            ->exists();
    }

    private function findOwnedAnimal(Request $request, $animalId): ?Animal
    {
        $user = $request->user();

        return Animal::whereHas('farm', fn ($q) => $q->where('user_id', $user->id))->find($animalId);
    }

    private function findOwnedCycle(Request $request, $id): ?BreedingCycle
    {
        $user = $request->user();

        return BreedingCycle::whereHas('dam.farm', fn ($q) => $q->where('user_id', $user->id))->find($id);
    }

    private function present(BreedingCycle $cycle): array
    {
        return [
            'id' => $cycle->id,
            'animal_id' => $cycle->animal_id,
            'sire_id' => $cycle->sire_id,
            'sire_name' => $cycle->sire?->name,
            'method' => $cycle->method,
            'bred_on' => $cycle->bred_on->toDateString(),
            'pregnancy_check_on' => $cycle->pregnancy_check_on?->toDateString(),
            'pregnancy_result' => $cycle->pregnancy_result,
            'weaned_on' => $cycle->weaned_on?->toDateString(),
            'notes' => $cycle->notes,
            'status' => $cycle->status,
            'expected_check_on' => $cycle->expected_check_on?->toDateString(),
            'expected_lambing_on' => $cycle->expected_lambing_on?->toDateString(),
            'expected_weaning_on' => $cycle->expected_weaning_on?->toDateString(),
            'birth_id' => $cycle->birth?->id,
        ];
    }
}
