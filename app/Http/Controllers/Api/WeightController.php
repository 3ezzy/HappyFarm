<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Animal;
use App\Models\Weight;
use Illuminate\Http\Request;

class WeightController extends Controller
{
    /**
     * List an animal's weight history, most recent first.
     */
    public function index(Request $request, $animalId)
    {
        $animal = $this->findOwnedAnimal($request, $animalId);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        $weights = $animal->weights()->orderByDesc('measured_at')->get(['id', 'weight_kg', 'measured_at', 'notes']);

        return response()->json($weights->map(fn ($weight) => $this->present($weight)));
    }

    /**
     * Record a new weight entry for an animal.
     */
    public function store(Request $request, $animalId)
    {
        $animal = $this->findOwnedAnimal($request, $animalId);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        $validated = $request->validate([
            'weight_kg' => 'required|numeric|min:0|max:9999.99',
            'measured_at' => 'required|date|before_or_equal:today',
            'notes' => 'nullable|string|max:500',
        ]);

        $weight = $animal->weights()->create($validated);

        return response()->json($this->present($weight), 201);
    }

    /**
     * Update a weight entry.
     */
    public function update(Request $request, $id)
    {
        $weight = $this->findOwnedWeight($request, $id);

        if (!$weight) {
            return response()->json(['error' => 'Weight record not found'], 404);
        }

        $validated = $request->validate([
            'weight_kg' => 'required|numeric|min:0|max:9999.99',
            'measured_at' => 'required|date|before_or_equal:today',
            'notes' => 'nullable|string|max:500',
        ]);

        $weight->update($validated);

        return response()->json($this->present($weight));
    }

    /**
     * Delete a weight entry.
     */
    public function destroy(Request $request, $id)
    {
        $weight = $this->findOwnedWeight($request, $id);

        if (!$weight) {
            return response()->json(['error' => 'Weight record not found'], 404);
        }

        $weight->delete();

        return response()->json(['message' => 'Weight record deleted']);
    }

    private function findOwnedAnimal(Request $request, $animalId): ?Animal
    {
        $user = $request->user();

        return Animal::whereHas('farm', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->find($animalId);
    }

    private function findOwnedWeight(Request $request, $id): ?Weight
    {
        $user = $request->user();

        return Weight::whereHas('animal.farm', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->find($id);
    }

    /**
     * Format measured_at as a plain date, matching the animals endpoints'
     * convention (date_of_birth, date_of_purchase, exit_date) — Weight's
     * `measured_at` cast otherwise serializes as a full midnight-UTC
     * timestamp, which is misleading for a date-only value.
     */
    private function present(Weight $weight): array
    {
        return [
            'id' => $weight->id,
            'weight_kg' => (float) $weight->weight_kg,
            'measured_at' => $weight->measured_at->toDateString(),
            'notes' => $weight->notes,
        ];
    }
}
