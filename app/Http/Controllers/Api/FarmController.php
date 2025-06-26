<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class FarmController extends Controller
{
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
    public function statistics(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;
        
        if (!$farm) {
            return response()->json(['error' => 'No farm found for user'], 404);
        }

        $farm->load('animals');
        
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
            ]
        ]);
    }
} 