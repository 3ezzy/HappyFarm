<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Farm;
use App\Models\Animal;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create test user
        $user = User::create([
            'name' => 'Ali Eid',
            'email' => 'ali@example.com',
            'password' => bcrypt('password'),
        ]);

        // Create farm for the user
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        // Create sample animals
        $animals = [
            [
                'type' => 'sheep',
                'name' => 'Whitey',
                'age' => 1.5,
            ],
            [
                'type' => 'goat',
                'name' => 'Billy',
                'age' => 2.0,
            ],
            [
                'type' => 'cow',
                'name' => 'Bessie',
                'age' => 3.0,
            ],
            [
                'type' => 'camel',
                'name' => 'Humpy',  
                'age' => 6.0,
            ],
            [
                'type' => 'sheep',
                'name' => 'Young Lamb',
                'age' => 0.25, // 3 months - not eligible for sacrifice
            ],
        ];

        foreach ($animals as $animalData) {
            Animal::create([
                'farm_id' => $farm->id,
                'type' => $animalData['type'],
                'name' => $animalData['name'],
                'age' => $animalData['age'],
            ]);
        }

        // Create another test user
        $user2 = User::create([
            'name' => 'Ahmad Farmer',
            'email' => 'ahmad@example.com',
            'password' => bcrypt('password'),
        ]);

        $farm2 = Farm::create([
            'user_id' => $user2->id,
            'name' => $user2->name . "'s Farm",
        ]);

        Animal::create([
            'farm_id' => $farm2->id,
            'type' => 'goat',
            'name' => 'Nanny',
            'age' => 1.5,
        ]);
    }
}
