<?php

namespace Database\Seeders;

use App\Models\Breed;
use Illuminate\Database\Seeder;

/**
 * Starting list only — a handful of common breeds per species so the
 * dropdown isn't empty. Expected to grow as real usage surfaces gaps.
 */
class BreedSeeder extends Seeder
{
    public function run(): void
    {
        $breeds = [
            'sheep' => ['Sardi', "D'man", 'Timahdite', 'Boujaad', 'Beni Guil', 'Awassi'],
            'goat' => ['Local Goat', 'Boer', 'Alpine'],
            'cow' => ['Holstein', 'Jersey', 'Local Cattle'],
            'camel' => ['Dromedary', 'Local Camel'],
        ];

        foreach ($breeds as $species => $names) {
            foreach ($names as $name) {
                Breed::firstOrCreate(['species' => $species, 'name' => $name, 'farm_id' => null]);
            }
        }
    }
}
