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
     * Display a listing of the user's animals.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;
        
        if (!$farm) {
            return response()->json(['error' => 'No farm found for user'], 404);
        }

        $animals = $farm->animals()->get();

        return response()->json($animals->map(function ($animal) {
            return [
                'id' => $animal->id,
                'type' => $animal->type,
                'name' => $animal->name,
                'age' => $animal->age,
                'fed_at' => $animal->fed_at?->toISOString(),
                'groomed_at' => $animal->groomed_at?->toISOString(),
                'sacrificed_at' => $animal->sacrificed_at?->toISOString(),
                'is_sacrificed' => $animal->is_sacrificed,
            ];
        }));
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

        $animal = Animal::create([
            'farm_id' => $farm->id,
            'type' => $request->type,
            'name' => $request->name,
            'age' => $request->age,
        ]);

        return response()->json([
            'id' => $animal->id,
            'type' => $animal->type,
            'name' => $animal->name,
            'age' => $animal->age,
            'fed_at' => null,
            'groomed_at' => null,
            'sacrificed_at' => null,
            'is_sacrificed' => false,
        ], 201);
    }

    /**
     * Display the specified animal.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $animal = Animal::whereHas('farm', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->find($id);

        if (!$animal) {
            return response()->json(['error' => 'Animal not found'], 404);
        }

        return response()->json([
            'id' => $animal->id,
            'type' => $animal->type,
            'name' => $animal->name,
            'age' => $animal->age,
            'fed_at' => $animal->fed_at?->toISOString(),
            'groomed_at' => $animal->groomed_at?->toISOString(),
            'sacrificed_at' => $animal->sacrificed_at?->toISOString(),
            'is_sacrificed' => $animal->is_sacrificed,
        ]);
    }

    /**
     * Feed an animal.
     */
    public function feed(Request $request, $id)
    {
        $user = $request->user();
        $animal = Animal::whereHas('farm', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->find($id);

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
        $user = $request->user();
        $animal = Animal::whereHas('farm', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->find($id);

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
        $user = $request->user();
        $animal = Animal::whereHas('farm', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })->find($id);

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

        $animal->update([
            'sacrificed_at' => Carbon::now(),
        ]);

        return response()->json([
            'id' => $animal->id,
            'sacrificed_at' => $animal->sacrificed_at->toISOString(),
            'is_sacrificed' => true,
        ]);
    }
} 