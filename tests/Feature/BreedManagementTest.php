<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Breed;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BreedManagementTest extends TestCase
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

    private function globalBreed(array $overrides = []): Breed
    {
        return Breed::create(array_merge([
            'farm_id' => null,
            'species' => 'sheep',
            'name' => 'Sardi',
        ], $overrides));
    }

    private function customBreed(Farm $farm, array $overrides = []): Breed
    {
        return Breed::create(array_merge([
            'farm_id' => $farm->id,
            'species' => 'sheep',
            'name' => 'Custom Sheep',
        ], $overrides));
    }

    private function animal(Farm $farm, array $overrides = []): Animal
    {
        return Animal::create(array_merge([
            'farm_id' => $farm->id,
            'type' => 'sheep',
            'name' => 'Nour',
            'sex' => 'female',
            'age' => 3,
        ], $overrides));
    }

    // ------------------------------------------------------------
    // Create / list / farm scoping
    // ------------------------------------------------------------

    public function test_a_custom_breed_can_be_created()
    {
        [$user, $farm] = $this->farmOwner();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/breeds', [
            'species' => 'goat', 'name' => 'My Goat Breed',
        ]);

        $response->assertStatus(201)->assertJson(['species' => 'goat', 'name' => 'My Goat Breed']);
        $this->assertDatabaseHas('breeds', ['farm_id' => $farm->id, 'species' => 'goat', 'name' => 'My Goat Breed']);
    }

    public function test_creating_a_duplicate_custom_breed_name_for_the_same_farm_and_species_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $this->customBreed($farm, ['species' => 'goat', 'name' => 'My Goat Breed']);

        $this->actingAs($user, 'sanctum')->postJson('/api/breeds', [
            'species' => 'goat', 'name' => 'My Goat Breed',
        ])->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_the_breed_list_includes_global_and_this_farms_own_custom_breeds()
    {
        [$user, $farm] = $this->farmOwner();
        $global = $this->globalBreed();
        $mine = $this->customBreed($farm);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/breeds');
        $ids = collect($response->json())->pluck('id');

        $this->assertTrue($ids->contains($global->id));
        $this->assertTrue($ids->contains($mine->id));
    }

    public function test_the_breed_list_flags_in_use_custom_breeds()
    {
        [$user, $farm] = $this->farmOwner();
        $used = $this->customBreed($farm, ['name' => 'Used']);
        $unused = $this->customBreed($farm, ['name' => 'Unused']);
        $this->animal($farm, ['breed_id' => $used->id]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/breeds');
        $byId = collect($response->json())->keyBy('id');

        $this->assertTrue($byId[$used->id]['in_use']);
        $this->assertFalse($byId[$unused->id]['in_use']);
    }

    public function test_another_farms_custom_breeds_are_not_visible()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $theirs = $this->customBreed($farm);

        $response = $this->actingAs($intruder, 'sanctum')->getJson('/api/breeds');

        $this->assertFalse(collect($response->json())->pluck('id')->contains($theirs->id));
    }

    // ------------------------------------------------------------
    // Ownership: update / delete
    // ------------------------------------------------------------

    public function test_a_farm_can_update_its_own_unused_custom_breed_freely()
    {
        [$user, $farm] = $this->farmOwner();
        $breed = $this->customBreed($farm, ['species' => 'sheep', 'name' => 'Old Name']);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/breeds/{$breed->id}", [
            'species' => 'goat', 'name' => 'New Name',
        ]);

        $response->assertStatus(200)->assertJson(['species' => 'goat', 'name' => 'New Name']);
    }

    public function test_updating_a_global_breed_is_rejected_as_not_found()
    {
        [$user] = $this->farmOwner();
        $global = $this->globalBreed();

        $this->actingAs($user, 'sanctum')->putJson("/api/breeds/{$global->id}", [
            'species' => 'sheep', 'name' => 'Hijacked',
        ])->assertStatus(404);
    }

    public function test_updating_another_farms_custom_breed_is_rejected_as_not_found()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $theirs = $this->customBreed($farm);

        $this->actingAs($intruder, 'sanctum')->putJson("/api/breeds/{$theirs->id}", [
            'species' => 'sheep', 'name' => 'Hijacked',
        ])->assertStatus(404);
    }

    public function test_deleting_a_global_breed_is_rejected_as_not_found()
    {
        [$user] = $this->farmOwner();
        $global = $this->globalBreed();

        $this->actingAs($user, 'sanctum')->deleteJson("/api/breeds/{$global->id}")->assertStatus(404);
        $this->assertDatabaseHas('breeds', ['id' => $global->id]);
    }

    public function test_deleting_another_farms_custom_breed_is_rejected_as_not_found()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $theirs = $this->customBreed($farm);

        $this->actingAs($intruder, 'sanctum')->deleteJson("/api/breeds/{$theirs->id}")->assertStatus(404);
        $this->assertDatabaseHas('breeds', ['id' => $theirs->id]);
    }

    public function test_an_unused_custom_breed_can_be_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $breed = $this->customBreed($farm);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/breeds/{$breed->id}")->assertStatus(200);
        $this->assertDatabaseMissing('breeds', ['id' => $breed->id]);
    }

    // ------------------------------------------------------------
    // Species-lock-while-in-use
    // ------------------------------------------------------------

    public function test_species_can_be_changed_on_an_unused_custom_breed()
    {
        [$user, $farm] = $this->farmOwner();
        $breed = $this->customBreed($farm, ['species' => 'sheep']);

        $this->actingAs($user, 'sanctum')->putJson("/api/breeds/{$breed->id}", [
            'species' => 'goat', 'name' => $breed->name,
        ])->assertStatus(200)->assertJson(['species' => 'goat']);
    }

    public function test_name_can_still_be_changed_on_a_used_custom_breed()
    {
        [$user, $farm] = $this->farmOwner();
        $breed = $this->customBreed($farm, ['species' => 'sheep']);
        $this->animal($farm, ['breed_id' => $breed->id]);

        $this->actingAs($user, 'sanctum')->putJson("/api/breeds/{$breed->id}", [
            'species' => 'sheep', 'name' => 'Renamed While Used',
        ])->assertStatus(200)->assertJson(['name' => 'Renamed While Used']);
    }

    public function test_species_change_on_a_used_custom_breed_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $breed = $this->customBreed($farm, ['species' => 'sheep']);
        $this->animal($farm, ['breed_id' => $breed->id]);

        $this->actingAs($user, 'sanctum')->putJson("/api/breeds/{$breed->id}", [
            'species' => 'goat', 'name' => $breed->name,
        ])->assertStatus(422)->assertJsonValidationErrors('species');

        $this->assertDatabaseHas('breeds', ['id' => $breed->id, 'species' => 'sheep']);
    }

    /**
     * An archived (soft-deleted) animal still counts as "using" the
     * breed — the species lock must not quietly lift just because the
     * only referencing animal was archived.
     */
    public function test_species_change_is_rejected_while_the_breed_is_used_only_by_an_archived_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $breed = $this->customBreed($farm, ['species' => 'sheep']);
        $animal = $this->animal($farm, ['breed_id' => $breed->id]);
        $animal->weights()->create(['weight_kg' => 10, 'measured_at' => now()]);
        $animal->delete(); // archives, since it now has weight history

        $this->actingAs($user, 'sanctum')->putJson("/api/breeds/{$breed->id}", [
            'species' => 'goat', 'name' => $breed->name,
        ])->assertStatus(422)->assertJsonValidationErrors('species');
    }

    public function test_deleting_a_breed_used_by_an_archived_animal_is_still_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $breed = $this->customBreed($farm, ['species' => 'sheep']);
        $animal = $this->animal($farm, ['breed_id' => $breed->id]);
        $animal->weights()->create(['weight_kg' => 10, 'measured_at' => now()]);
        $animal->delete();

        $this->actingAs($user, 'sanctum')->deleteJson("/api/breeds/{$breed->id}")->assertStatus(422);
        $this->assertDatabaseHas('breeds', ['id' => $breed->id]);
    }

    // ------------------------------------------------------------
    // Cross-farm breed_id assignment on animals
    // ------------------------------------------------------------

    public function test_a_farm_cannot_assign_another_farms_custom_breed_to_its_own_animal_on_create()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $theirs = $this->customBreed($farm);

        $this->actingAs($intruder, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Hijack', 'sex' => 'female', 'age' => 1, 'breed_id' => $theirs->id,
        ])->assertStatus(422)->assertJsonValidationErrors('breed_id');
    }

    public function test_a_farm_cannot_assign_another_farms_custom_breed_to_its_own_animal_on_update()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder, $intruderFarm] = $this->farmOwner();
        $theirs = $this->customBreed($farm);
        $mine = $this->animal($intruderFarm, ['sex' => 'female']);

        $this->actingAs($intruder, 'sanctum')->putJson("/api/animals/{$mine->id}", [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'female', 'age' => 3, 'breed_id' => $theirs->id,
        ])->assertStatus(422)->assertJsonValidationErrors('breed_id');
    }

    public function test_a_farm_can_assign_a_global_breed_to_its_own_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $global = $this->globalBreed();

        $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'female', 'age' => 3, 'breed_id' => $global->id,
        ])->assertStatus(201)->assertJson(['breed' => $global->name]);
    }

    public function test_a_farm_can_assign_its_own_custom_breed_to_its_own_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $mine = $this->customBreed($farm);

        $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'female', 'age' => 3, 'breed_id' => $mine->id,
        ])->assertStatus(201)->assertJson(['breed' => $mine->name]);
    }
}
