<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use App\Http\Requests\AnimalRequest;
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

        $query = $farm->animals()->with('breed');

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
        $animal = $this->findOwnedAnimal($request, $id, with: ['breed']);

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

        if ($animal->is_sacrificed) {
            return response()->json(['error' => 'Cannot feed a sacrificed animal'], 400);
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

        if ($animal->is_sacrificed) {
            return response()->json(['error' => 'Cannot groom a sacrificed animal'], 400);
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

        // Check sacrifice eligibility
        if (!$animal->isEligibleForSacrifice()) {
            return response()->json([
                'error' => $animal->getSacrificeEligibilityError()
            ], 400);
        }

        $now = Carbon::now();

        // exit_date/exit_reason generalize sacrificed_at to also cover
        // death and sale (added to the schema this phase, not yet exposed
        // through a dedicated endpoint). Set alongside sacrificed_at so the
        // two never drift while sacrifice() is the only path that writes
        // either of them.
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
     * Find an animal by id, scoped to the authenticated user's farm.
     */
    private function findOwnedAnimal(Request $request, $id, array $with = []): ?Animal
    {
        $user = $request->user();

        return Animal::with($with)
            ->whereHas('farm', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->find($id);
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
            'fed_at' => $animal->fed_at?->toISOString(),
            'groomed_at' => $animal->groomed_at?->toISOString(),
            'sacrificed_at' => $animal->sacrificed_at?->toISOString(),
            'is_sacrificed' => $animal->is_sacrificed,
            'exit_date' => $animal->exit_date?->toDateString(),
            'exit_reason' => $animal->exit_reason,
            'is_eligible' => $animal->isEligibleForSacrifice(),
            'min_age_text' => Animal::MIN_AGE_TEXT[$animal->type] ?? null,
        ];
    }
}
