<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use App\Http\Requests\AnimalRequest;
use App\Http\Requests\AnimalUpdateRequest;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AnimalController extends Controller
{
    /**
     * Display a listing of the user's animals. Supports ?search= against
     * tag and name (case-insensitive partial match) for the quick-search
     * requirement — LOWER()+LIKE rather than ILIKE so it behaves the same
     * whether the app is running against Postgres (dev/prod) or SQLite
     * (the test suite).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['error' => 'No farm found for user'], 404);
        }

        $query = $farm->animals()->with(['breed', 'breedingCycles.birth', 'healthRecords']);

        // Archived animals are excluded by the SoftDeletes scope by
        // default — this is the only way back into seeing them, and it's
        // deliberately all-or-nothing (not merged with the active list),
        // since archiving specifically means "off my working view."
        if ($request->boolean('archived')) {
            $query->onlyTrashed();
        }

        if ($search = trim((string) $request->query('search'))) {
            $needle = '%' . strtolower($search) . '%';
            $query->where(function ($q) use ($needle) {
                $q->whereRaw('LOWER(tag) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(name) LIKE ?', [$needle]);
            });
        }

        $animals = $query->get();

        return response()->json($animals->map(fn ($animal) => $this->present($animal)));
    }

    /**
     * Store a newly created animal.
     */
    public function store(AnimalRequest $request)
    {
        // Validation is automatically handled by AnimalRequest

        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['error' => 'No farm found for user'], 404);
        }

        $payload = [
            'farm_id' => $farm->id,
            'type' => $request->type,
            'name' => $request->name,
            'tag' => $request->tag,
            'breed_id' => $request->breed_id,
            'sex' => $request->sex,
            'date_of_purchase' => $request->date_of_purchase,
            'origin' => $request->origin,
            'dam_id' => $request->dam_id,
            'sire_id' => $request->sire_id,
        ];

        // Only one of age/date_of_birth is passed to Animal::create(). Both
        // ultimately write date_of_birth (age via a mutator); passing both
        // keys risks whichever runs second silently overwriting the other,
        // including overwriting a real date with null.
        if ($request->filled('date_of_birth')) {
            $payload['date_of_birth'] = $request->date_of_birth;
        } elseif ($request->filled('age')) {
            $payload['age'] = $request->age;
        }

        $animal = Animal::create($payload);

        // Animal::create() returns the in-memory model as filled, which
        // doesn't reflect DB-level column defaults (is_sacrificed=false)
        // that were never explicitly assigned. Reload so present() reports
        // what's actually in the database.
        $animal->refresh();

        return response()->json($this->present($animal), 201);
    }

    /**
     * Display the specified animal.
     */
    public function show(Request $request, $id)
    {
        // withTrashed: an archived animal must still be viewable — both to
        // restore it and so a descendant's profile can link to an
        // archived dam/sire's own page.
        $animal = $this->findOwnedAnimal($request, $id, with: ['breed', 'breedingCycles.birth', 'healthRecords'], withTrashed: true);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        return response()->json($this->present($animal));
    }

    /**
     * Feed an animal.
     */
    public function feed(Request $request, $id)
    {
        $animal = $this->findOwnedAnimal($request, $id);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        if ($animal->hasExited()) {
            return response()->json(['error' => 'Cannot feed an animal that has left the flock'], 400);
        }

        $animal->update([
            'fed_at' => Carbon::now(),
        ]);

        return response()->json([
            'id' => $animal->id,
            'fed_at' => $animal->fed_at->toISOString(),
        ]);
    }

    /**
     * Groom an animal.
     */
    public function groom(Request $request, $id)
    {
        $animal = $this->findOwnedAnimal($request, $id);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        if ($animal->hasExited()) {
            return response()->json(['error' => 'Cannot groom an animal that has left the flock'], 400);
        }

        $animal->update([
            'groomed_at' => Carbon::now(),
        ]);

        return response()->json([
            'id' => $animal->id,
            'groomed_at' => $animal->groomed_at->toISOString(),
        ]);
    }

    /**
     * Sacrifice an animal.
     */
    public function sacrifice(Request $request, $id)
    {
        $animal = $this->findOwnedAnimal($request, $id);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        if ($animal->is_sacrificed) {
            return response()->json(['error' => 'Animal has already been sacrificed'], 400);
        }

        if ($animal->hasExited()) {
            return response()->json(['error' => 'Animal has already exited the flock and cannot be sacrificed'], 400);
        }

        // Check sacrifice eligibility
        if (!$animal->isEligibleForSacrifice()) {
            return response()->json([
                'error' => $animal->getSacrificeEligibilityError()
            ], 400);
        }

        $now = Carbon::now();

        // exit_date/exit_reason generalize sacrificed_at to also cover
        // death and sale, recorded via recordExit() below instead. Set
        // alongside sacrificed_at here so the two never drift — sacrifice()
        // is the only path that ever writes 'sacrifice' as the reason.
        $animal->update([
            'sacrificed_at' => $now,
            'exit_date' => $now->toDateString(),
            'exit_reason' => 'sacrifice',
        ]);

        return response()->json([
            'id' => $animal->id,
            'sacrificed_at' => $animal->sacrificed_at->toISOString(),
            'is_sacrificed' => true,
            'exit_date' => $animal->exit_date->toDateString(),
            'exit_reason' => $animal->exit_reason,
        ]);
    }

    /**
     * Edit an animal's core profile. Excludes everything managed only by
     * a dedicated action (birth_id, is_sacrificed, sacrificed_at, fed_at,
     * groomed_at, exit_date, exit_reason) — same reasoning as
     * BreedingCycleController::update() excluding pregnancy_result. Species
     * and sex are additionally locked once this animal has breeding
     * history; see AnimalUpdateRequest.
     */
    public function update(AnimalUpdateRequest $request, $id)
    {
        $animal = $this->findOwnedAnimal($request, $id);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        $payload = [
            'type' => $request->type,
            'name' => $request->name,
            'tag' => $request->tag,
            'breed_id' => $request->breed_id,
            'sex' => $request->sex,
            'date_of_purchase' => $request->date_of_purchase,
            'origin' => $request->origin,
            'dam_id' => $request->dam_id,
            'sire_id' => $request->sire_id,
        ];

        if ($request->filled('date_of_birth')) {
            $payload['date_of_birth'] = $request->date_of_birth;
        } elseif ($request->filled('age')) {
            $payload['age'] = $request->age;
        }

        $animal->update($payload);
        $animal->refresh();
        $animal->load(['breed', 'breedingCycles.birth', 'healthRecords']);

        return response()->json($this->present($animal));
    }

    /**
     * Archives an animal with any history (weights, health records,
     * breeding cycles, or being referenced as another animal's dam/sire);
     * permanently deletes only a clean animal with none of that. There is
     * deliberately no path from here to permanently deleting an animal
     * that has ever had history — once archived, restore() is the only
     * way back.
     */
    public function destroy(Request $request, $id)
    {
        $animal = $this->findOwnedAnimal($request, $id);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        $hasHistory = $animal->weights()->exists()
            || $animal->healthRecords()->exists()
            || $animal->breedingCycles()->exists()
            || Animal::where('dam_id', $animal->id)->orWhere('sire_id', $animal->id)->exists()
            || $animal->is_sacrificed
            || $animal->hasExited();

        if ($hasHistory) {
            $animal->delete();

            return response()->json(['message' => 'Animal archived', 'action' => 'archived']);
        }

        $animal->forceDelete();

        return response()->json(['message' => 'Animal deleted', 'action' => 'deleted']);
    }

    /**
     * Restores an archived animal. Ownership-scoped via withTrashed()
     * since the default scope would never find it otherwise.
     */
    public function restore(Request $request, $id)
    {
        $animal = $this->findOwnedAnimal($request, $id, withTrashed: true);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        if (!$animal->trashed()) {
            return response()->json(['error' => 'Animal is not archived'], 400);
        }

        $animal->restore();
        $animal->load(['breed', 'breedingCycles.birth', 'healthRecords']);

        return response()->json($this->present($animal));
    }

    /**
     * Record a death or sale exit. Separate from sacrifice() on purpose:
     * no age-eligibility gate applies, and this never touches
     * sacrificed_at/is_sacrificed, which continue to mean only "was
     * sacrificed" — not the broader "has left the flock" that
     * Animal::hasExited() covers.
     */
    public function recordExit(Request $request, $id)
    {
        $animal = $this->findOwnedAnimal($request, $id);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        if ($animal->hasExited()) {
            return response()->json(['error' => 'Animal has already exited the flock'], 400);
        }

        $validated = $request->validate([
            'reason' => 'required|in:death,sale',
            'exit_date' => 'required|date|before_or_equal:today',
        ]);

        $animal->update([
            'exit_date' => $validated['exit_date'],
            'exit_reason' => $validated['reason'],
        ]);

        return response()->json([
            'id' => $animal->id,
            'exit_date' => $animal->exit_date->toDateString(),
            'exit_reason' => $animal->exit_reason,
            'is_sacrificed' => $animal->is_sacrificed,
        ]);
    }

    /**
     * Find an animal by id, scoped to the authenticated user's farm.
     */
    private function findOwnedAnimal(Request $request, $id, array $with = [], bool $withTrashed = false): ?Animal
    {
        $user = $request->user();

        $query = Animal::with($with)
            ->whereHas('farm', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            });

        if ($withTrashed) {
            $query->withTrashed();
        }

        return $query->find($id);
    }

    /**
     * Shape an Animal for API responses. All fields from the original
     * contract (id, type, name, age, fed_at, groomed_at, sacrificed_at,
     * is_sacrificed) are unchanged; everything else is additive.
     */
    private function present(Animal $animal): array
    {
        return [
            'id' => $animal->id,
            'type' => $animal->type,
            'name' => $animal->name,
            'tag' => $animal->tag,
            'breed_id' => $animal->breed_id,
            'breed' => $animal->breed?->name,
            'sex' => $animal->sex,
            'age' => $animal->age,
            'date_of_birth' => $animal->date_of_birth?->toDateString(),
            'date_of_purchase' => $animal->date_of_purchase?->toDateString(),
            'origin' => $animal->origin,
            'dam_id' => $animal->dam_id,
            'sire_id' => $animal->sire_id,
            'birth_id' => $animal->birth_id,
            'fed_at' => $animal->fed_at?->toISOString(),
            'groomed_at' => $animal->groomed_at?->toISOString(),
            'sacrificed_at' => $animal->sacrificed_at?->toISOString(),
            'is_sacrificed' => $animal->is_sacrificed,
            'exit_date' => $animal->exit_date?->toDateString(),
            'exit_reason' => $animal->exit_reason,
            'is_eligible' => $animal->isEligibleForSacrifice(),
            'min_age_text' => Animal::MIN_AGE_TEXT[$animal->type] ?? null,
            // Reused as the breeding-maturity threshold too (Phase 4) — the
            // frontend's dam/sire filters read this rather than
            // re-declaring Animal::MIN_AGES client-side.
            'min_age' => Animal::MIN_AGES[$animal->type] ?? null,
            'is_archived' => $animal->trashed(),
            // Same condition AnimalUpdateRequest enforces server-side —
            // exposed so the edit form can disable species/sex without
            // re-implementing the rule client-side.
            'breeding_locked' => $animal->breedingCycles()->exists()
                || Animal::where('dam_id', $animal->id)->orWhere('sire_id', $animal->id)->exists(),
            'breeding_status' => $animal->breeding_status,
            'active_withdrawal' => $animal->active_withdrawal ? [
                'health_record_id' => $animal->active_withdrawal->id,
                'kind' => $animal->active_withdrawal->kind,
                'product' => $animal->active_withdrawal->product,
                'withdrawal_until' => $animal->active_withdrawal->withdrawal_until->toDateString(),
            ] : null,
        ];
    }
}
