<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BreedRequest;
use App\Http\Requests\BreedUpdateRequest;
use App\Models\Animal;
use App\Models\Breed;
use Illuminate\Http\Request;

class BreedController extends Controller
{
    /**
     * List breeds, optionally filtered by species, for populating the
     * breed dropdown on the animal form. Returns global breeds plus this
     * farm's own custom breeds; another farm's custom breeds are never
     * included.
     */
    public function index(Request $request)
    {
        $farmId = $request->user()->farm?->id;

        $query = Breed::query()
            ->where(fn ($q) => $q->whereNull('farm_id')->orWhere('farm_id', $farmId))
            ->orderBy('species')
            ->orderBy('name');

        if ($species = $request->query('species')) {
            $query->where('species', $species);
        }

        $breeds = $query->get(['id', 'farm_id', 'species', 'name']);

        return response()->json($breeds->map(fn ($breed) => $this->present($breed)));
    }

    /**
     * Create a custom breed owned by the caller's own farm.
     */
    public function store(BreedRequest $request)
    {
        $breed = Breed::create([
            'farm_id' => $request->user()->farm->id,
            'species' => $request->species,
            'name' => $request->name,
        ]);

        return response()->json($this->present($breed), 201);
    }

    /**
     * Rename or re-species a custom breed owned by the caller's own farm.
     * Global breeds and other farms' breeds 404 identically, since
     * neither is "owned" by this farm. Species-lock-while-in-use is
     * enforced in BreedUpdateRequest.
     */
    public function update(BreedUpdateRequest $request, $id)
    {
        $breed = $this->findOwnedBreed($request, $id);

        if (!$breed) {
            return response()->json(['error' => 'Breed not found'], 404);
        }

        $breed->update([
            'species' => $request->species,
            'name' => $request->name,
        ]);

        return response()->json($this->present($breed));
    }

    /**
     * Delete a custom breed owned by the caller's own farm, as long as no
     * animal — including an archived one — currently references it.
     */
    public function destroy(Request $request, $id)
    {
        $breed = $this->findOwnedBreed($request, $id);

        if (!$breed) {
            return response()->json(['error' => 'Breed not found'], 404);
        }

        if (Animal::withTrashed()->where('breed_id', $breed->id)->exists()) {
            return response()->json(['error' => 'This breed is in use by an animal and cannot be deleted.'], 422);
        }

        $breed->delete();

        return response()->json(['message' => 'Breed deleted']);
    }

    /**
     * A breed is "owned" by this farm only if farm_id matches — global
     * breeds (farm_id null) and other farms' breeds both return null here.
     */
    private function findOwnedBreed(Request $request, $id): ?Breed
    {
        $farmId = $request->user()->farm?->id;

        return Breed::where('farm_id', $farmId)->find($id);
    }

    /**
     * `in_use` lets the frontend disable the species field before
     * submitting, rather than only finding out via a 422 from
     * BreedUpdateRequest — same "derive, don't reimplement" approach as
     * `breeding_locked` on the animal response. Only computed for custom
     * breeds, since global breeds aren't editable through this API
     * regardless of whether they're in use.
     */
    private function present(Breed $breed): array
    {
        return [
            'id' => $breed->id,
            'farm_id' => $breed->farm_id,
            'species' => $breed->species,
            'name' => $breed->name,
            'in_use' => $breed->farm_id !== null && Animal::withTrashed()->where('breed_id', $breed->id)->exists(),
        ];
    }
}
