<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Breed;
use Illuminate\Http\Request;

class BreedController extends Controller
{
    /**
     * List breeds, optionally filtered by species, for populating the
     * breed dropdown on the animal form.
     */
    public function index(Request $request)
    {
        $query = Breed::query()->orderBy('species')->orderBy('name');

        if ($species = $request->query('species')) {
            $query->where('species', $species);
        }

        return response()->json($query->get(['id', 'species', 'name']));
    }
}
