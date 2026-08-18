<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Farm;
use App\Models\User;
use App\Models\Weight;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 1 shipped weights as create/list only. This covers the Phase 2
 * edit/delete retrofit specifically — see AnimalProfileTest.php for the
 * original create/list coverage.
 */
class WeightControllerTest extends TestCase
{
    use RefreshDatabase;

    private function farmOwner(): array
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        return [$user, $farm];
    }

    private function animal(Farm $farm): Animal
    {
        return Animal::create(['farm_id' => $farm->id, 'type' => 'sheep', 'name' => 'Nour', 'age' => 2]);
    }

    public function test_weight_can_be_updated()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $weight = Weight::create(['animal_id' => $animal->id, 'weight_kg' => 40, 'measured_at' => now()]);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/weights/{$weight->id}", [
            'weight_kg' => 42.5,
            'measured_at' => now()->toDateString(),
            'notes' => 'corrected',
        ]);

        $response->assertStatus(200)->assertJson(['weight_kg' => 42.5, 'notes' => 'corrected']);
    }

    public function test_weight_can_be_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $weight = Weight::create(['animal_id' => $animal->id, 'weight_kg' => 40, 'measured_at' => now()]);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/weights/{$weight->id}")->assertStatus(200);
        $this->assertDatabaseMissing('weights', ['id' => $weight->id]);
    }

    public function test_another_farm_cannot_edit_or_delete_this_farms_weight()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $animal = $this->animal($farm);
        $weight = Weight::create(['animal_id' => $animal->id, 'weight_kg' => 40, 'measured_at' => now()]);

        $this->actingAs($intruder, 'sanctum')->putJson("/api/weights/{$weight->id}", [
            'weight_kg' => 99, 'measured_at' => now()->toDateString(),
        ])->assertStatus(404);

        $this->actingAs($intruder, 'sanctum')->deleteJson("/api/weights/{$weight->id}")->assertStatus(404);

        $this->assertDatabaseHas('weights', ['id' => $weight->id, 'weight_kg' => 40]);
    }
}
