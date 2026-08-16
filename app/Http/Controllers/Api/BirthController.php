<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BirthRequest;
use App\Models\Animal;
use App\Models\Birth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BirthController extends Controller
{
    /**
     * List a dam's births, most recent first.
     */
    public function index(Request $request, $animalId)
    {
        $dam = $this->findOwnedAnimal($request, $animalId);

        if (!$dam) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        $births = $dam->births()->with(['sire', 'animals'])->orderByDesc('born_on')->get();

        return response()->json($births->map(fn ($b) => $this->present($b)));
    }

    /**
     * Record a birth. Creates one real animal record per live offspring
     * (never for the stillborn difference between offspring_total and
     * offspring_alive — those are only ever a count on this row) and, for
     * any offspring with a birth weight given, a matching first entry in
     * its weight history rather than a separate column.
     */
    public function store(BirthRequest $request, $animalId)
    {
        $dam = $this->findOwnedAnimal($request, $animalId);

        if (!$dam) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        if ($request->filled('breeding_cycle_id') && !$dam->breedingCycles()->whereKey($request->breeding_cycle_id)->exists()) {
            return response()->json(['error' => 'The selected breeding cycle does not belong to this animal'], 422);
        }

        $birth = DB::transaction(function () use ($request, $dam) {
            $birth = Birth::create([
                'breeding_cycle_id' => $request->breeding_cycle_id,
                'dam_id' => $dam->id,
                'sire_id' => $request->sire_id,
                'born_on' => $request->born_on,
                'offspring_total' => $request->offspring_total,
                'offspring_alive' => $request->offspring_alive,
                'difficulty' => $request->difficulty,
                'notes' => $request->notes,
            ]);

            foreach ($request->input('offspring', []) as $offspring) {
                $lamb = Animal::create([
                    'farm_id' => $dam->farm_id,
                    'type' => $dam->type,
                    'name' => $offspring['name'],
                    'tag' => $offspring['tag'] ?? null,
                    'sex' => $offspring['sex'],
                    'date_of_birth' => $birth->born_on,
                    'origin' => 'born',
                    'dam_id' => $dam->id,
                    'sire_id' => $request->sire_id,
                    'birth_id' => $birth->id,
                ]);

                if (!empty($offspring['birth_weight_kg'])) {
                    $lamb->weights()->create([
                        'weight_kg' => $offspring['birth_weight_kg'],
                        'measured_at' => $birth->born_on,
                        'notes' => 'Birth weight',
                    ]);
                }
            }

            return $birth;
        });

        $birth->load(['sire', 'animals']);

        return response()->json($this->present($birth), 201);
    }

    /**
     * Edit birth-level fields only (date, counts, difficulty, notes, the
     * cycle/sire it's linked to). Does not touch the animal records
     * already created — correcting an individual lamb's name, sex, or tag
     * happens on that animal's own record, not here.
     */
    public function update(Request $request, $id)
    {
        $birth = $this->findOwnedBirth($request, $id);

        if (!$birth) {
            return response()->json(['error' => 'Birth record not found'], 404);
        }

        $farmId = $request->user()?->farm?->id;

        $validated = $request->validate([
            // Structural check only, same reasoning as BirthRequest — a
            // relationship-aware whereHas() doesn't work inside
            // Rule::exists()->where()'s plain query builder. Ownership is
            // checked explicitly below against this birth's own dam.
            'breeding_cycle_id' => 'nullable|integer',
            'sire_id' => [
                'nullable', 'integer',
                Rule::exists('animals', 'id')->where(
                    fn ($q) => $q->where('farm_id', $farmId)->where('sex', 'male')
                ),
            ],
            'born_on' => 'required|date|before_or_equal:today',
            'offspring_total' => 'required|integer|min:0',
            'offspring_alive' => 'required|integer|min:0|lte:offspring_total',
            'difficulty' => 'nullable|in:easy,assisted,difficult,cesarean',
            'notes' => 'nullable|string|max:1000',
        ]);

        if (!empty($validated['breeding_cycle_id']) && !$birth->dam->breedingCycles()->whereKey($validated['breeding_cycle_id'])->exists()) {
            return response()->json(['error' => 'The selected breeding cycle does not belong to this animal'], 422);
        }

        $birth->update($validated);
        $birth->load(['sire', 'animals']);

        return response()->json($this->present($birth));
    }

    /**
     * Deleting a birth never deletes the animals it produced — birth_id is
     * nullOnDelete at the database level, verified directly against
     * Postgres when the migration was written. This just detaches the
     * provenance link; the lamb and its own history (weights, health
     * records) survive untouched.
     */
    public function destroy(Request $request, $id)
    {
        $birth = $this->findOwnedBirth($request, $id);

        if (!$birth) {
            return response()->json(['error' => 'Birth record not found'], 404);
        }

        $birth->delete();

        return response()->json(['message' => 'Birth record deleted']);
    }

    private function findOwnedAnimal(Request $request, $animalId): ?Animal
    {
        $user = $request->user();

        return Animal::whereHas('farm', fn ($q) => $q->where('user_id', $user->id))->find($animalId);
    }

    private function findOwnedBirth(Request $request, $id): ?Birth
    {
        $user = $request->user();

        return Birth::whereHas('dam.farm', fn ($q) => $q->where('user_id', $user->id))->find($id);
    }

    private function present(Birth $birth): array
    {
        return [
            'id' => $birth->id,
            'breeding_cycle_id' => $birth->breeding_cycle_id,
            'dam_id' => $birth->dam_id,
            'sire_id' => $birth->sire_id,
            'sire_name' => $birth->sire?->name,
            'born_on' => $birth->born_on->toDateString(),
            'offspring_total' => $birth->offspring_total,
            'offspring_alive' => $birth->offspring_alive,
            'difficulty' => $birth->difficulty,
            'notes' => $birth->notes,
            'animals' => $birth->animals->map(fn ($a) => [
                'id' => $a->id,
                'name' => $a->name,
                'tag' => $a->tag,
                'sex' => $a->sex,
            ]),
        ];
    }
}
