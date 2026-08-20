<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnimalLifecycleTest extends TestCase
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
    // Edit
    // ------------------------------------------------------------

    public function test_animal_can_be_edited()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['name' => 'Original', 'tag' => 'T-1']);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'sheep', 'name' => 'Renamed', 'sex' => 'female', 'age' => 3, 'tag' => 'T-1',
        ]);

        $response->assertStatus(200)->assertJson(['name' => 'Renamed']);
        $this->assertDatabaseHas('animals', ['id' => $animal->id, 'name' => 'Renamed']);
    }

    public function test_edit_tag_uniqueness_excludes_the_animals_own_current_tag()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['tag' => 'T-1']);

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'female', 'age' => 3, 'tag' => 'T-1',
        ])->assertStatus(200);
    }

    public function test_edit_rejects_a_tag_already_used_by_another_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $this->animal($farm, ['name' => 'Other', 'tag' => 'TAKEN']);
        $animal = $this->animal($farm, ['name' => 'Mine', 'tag' => 'MINE']);

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'sheep', 'name' => 'Mine', 'sex' => 'female', 'age' => 3, 'tag' => 'TAKEN',
        ])->assertStatus(422)->assertJsonValidationErrors('tag');
    }

    public function test_species_and_sex_are_editable_with_zero_breeding_history()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal->id}")
            ->assertJson(['breeding_locked' => false]);

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'goat', 'name' => 'Nour', 'sex' => 'male', 'age' => 3,
        ])->assertStatus(200)->assertJson(['type' => 'goat', 'sex' => 'male']);
    }

    public function test_species_and_sex_are_locked_once_a_breeding_cycle_exists()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        \App\Models\BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()]);

        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$dam->id}")
            ->assertJson(['breeding_locked' => true]);

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$dam->id}", [
            'type' => 'goat', 'name' => 'Nour', 'sex' => 'female', 'age' => 3,
        ])->assertStatus(422)->assertJsonValidationErrors('type');

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$dam->id}", [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'male', 'age' => 3,
        ])->assertStatus(422)->assertJsonValidationErrors('sex');

        // Other fields, and resubmitting the unchanged species/sex, remain fine.
        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$dam->id}", [
            'type' => 'sheep', 'name' => 'Renamed', 'sex' => 'female', 'age' => 3,
        ])->assertStatus(200)->assertJson(['name' => 'Renamed']);
    }

    public function test_species_is_locked_once_referenced_as_another_animals_dam()
    {
        [$user, $farm] = $this->farmOwner();
        $mom = $this->animal($farm, ['name' => 'Mom']);
        $this->animal($farm, ['name' => 'Kid', 'dam_id' => $mom->id]);

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$mom->id}", [
            'type' => 'goat', 'name' => 'Mom', 'sex' => 'female', 'age' => 3,
        ])->assertStatus(422)->assertJsonValidationErrors('type');
    }

    public function test_dam_id_self_reference_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'female', 'age' => 3, 'dam_id' => $animal->id,
        ])->assertStatus(422)->assertJsonValidationErrors('dam_id');
    }

    public function test_another_farm_cannot_edit_this_farms_animal()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($intruder, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'sheep', 'name' => 'Hijacked', 'sex' => 'female', 'age' => 3,
        ])->assertStatus(404);
    }

    // ------------------------------------------------------------
    // Delete / archive
    // ------------------------------------------------------------

    public function test_deleting_a_clean_animal_with_no_history_is_permanent()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}");

        $response->assertStatus(200)->assertJson(['action' => 'deleted']);
        $this->assertDatabaseMissing('animals', ['id' => $animal->id]);
    }

    public function test_deleting_an_animal_with_weight_history_archives_it()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $animal->weights()->create(['weight_kg' => 10, 'measured_at' => now()]);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}");

        $response->assertStatus(200)->assertJson(['action' => 'archived']);
        $this->assertSoftDeleted('animals', ['id' => $animal->id]);
    }

    public function test_deleting_an_animal_with_health_records_archives_it()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $animal->healthRecords()->create(['kind' => 'vaccine', 'administered_on' => now()]);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}")
            ->assertStatus(200)->assertJson(['action' => 'archived']);
        $this->assertSoftDeleted('animals', ['id' => $animal->id]);
    }

    public function test_deleting_an_animal_with_a_breeding_cycle_archives_it()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        \App\Models\BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()]);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$dam->id}")
            ->assertStatus(200)->assertJson(['action' => 'archived']);
        $this->assertSoftDeleted('animals', ['id' => $dam->id]);
    }

    public function test_deleting_an_animal_referenced_as_a_dam_archives_it()
    {
        [$user, $farm] = $this->farmOwner();
        $mom = $this->animal($farm, ['name' => 'Mom']);
        $this->animal($farm, ['name' => 'Kid', 'dam_id' => $mom->id]);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$mom->id}")
            ->assertStatus(200)->assertJson(['action' => 'archived']);
        $this->assertSoftDeleted('animals', ['id' => $mom->id]);
    }

    public function test_another_farm_cannot_delete_this_farms_animal()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($intruder, 'sanctum')->deleteJson("/api/animals/{$animal->id}")->assertStatus(404);
        $this->assertDatabaseHas('animals', ['id' => $animal->id]);
    }

    /**
     * A sacrificed animal is exit history and must never be permanently
     * deletable, even with zero weight/health/breeding records — sacrifice
     * itself counts as history for deletion purposes.
     */
    public function test_a_sacrificed_animal_cannot_be_hard_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['sex' => 'male']);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/sacrifice")->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}");

        $response->assertStatus(200)->assertJson(['action' => 'archived']);
        $this->assertSoftDeleted('animals', ['id' => $animal->id]);
    }

    public function test_an_animal_that_died_cannot_be_hard_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/exit", [
            'reason' => 'death', 'exit_date' => now()->toDateString(),
        ])->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}");

        $response->assertStatus(200)->assertJson(['action' => 'archived']);
        $this->assertSoftDeleted('animals', ['id' => $animal->id]);
    }

    public function test_a_sold_animal_cannot_be_hard_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/exit", [
            'reason' => 'sale', 'exit_date' => now()->toDateString(),
        ])->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}");

        $response->assertStatus(200)->assertJson(['action' => 'archived']);
        $this->assertSoftDeleted('animals', ['id' => $animal->id]);
    }

    /**
     * The existing restore mechanism must keep working for animals archived
     * because of exit history, not just those archived for weight/health/
     * breeding history.
     */
    public function test_a_sacrificed_and_then_archived_animal_can_still_be_restored()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['sex' => 'male']);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/sacrifice")->assertStatus(200);
        $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}")->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/restore");

        $response->assertStatus(200)->assertJson(['is_archived' => false, 'is_sacrificed' => true]);
        $this->assertDatabaseHas('animals', ['id' => $animal->id, 'deleted_at' => null]);
    }

    // ------------------------------------------------------------
    // Archived filtering, statistics, alerts
    // ------------------------------------------------------------

    public function test_archived_animals_are_excluded_from_the_default_list_but_returned_by_the_filter()
    {
        [$user, $farm] = $this->farmOwner();
        $active = $this->animal($farm, ['name' => 'Active']);
        $archived = $this->animal($farm, ['name' => 'Archived']);
        $archived->weights()->create(['weight_kg' => 10, 'measured_at' => now()]);
        $archived->delete();

        $default = $this->actingAs($user, 'sanctum')->getJson('/api/animals')->json();
        $this->assertTrue(collect($default)->contains('id', $active->id));
        $this->assertFalse(collect($default)->contains('id', $archived->id));

        $archivedOnly = $this->actingAs($user, 'sanctum')->getJson('/api/animals?archived=1')->json();
        $this->assertFalse(collect($archivedOnly)->contains('id', $active->id));
        $this->assertTrue(collect($archivedOnly)->contains('id', $archived->id));
    }

    public function test_archived_animals_are_excluded_from_farm_statistics_and_alerts()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        \App\Models\BreedingCycle::create([
            'animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(50),
        ]);
        $dam->delete(); // archives, since it now has a breeding cycle

        $stats = $this->actingAs($user, 'sanctum')->getJson('/api/farm/statistics')->json();
        $this->assertSame(0, $stats['total_animals']);

        $alerts = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $this->assertEmpty(array_filter($alerts, fn ($a) => $a['animal_id'] === $dam->id));
    }

    public function test_a_descendants_dam_still_resolves_after_the_dam_is_archived()
    {
        [$user, $farm] = $this->farmOwner();
        $mom = $this->animal($farm, ['name' => 'Mom']);
        $kid = $this->animal($farm, ['name' => 'Kid', 'dam_id' => $mom->id]);
        $mom->delete(); // archives, since she's referenced as a dam

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$kid->id}");
        $response->assertStatus(200)->assertJson(['dam_id' => $mom->id]);

        // The dam's own profile must still resolve (withTrashed), not 404.
        $momResponse = $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$mom->id}");
        $momResponse->assertStatus(200)->assertJson(['name' => 'Mom', 'is_archived' => true]);
    }

    // ------------------------------------------------------------
    // Restore
    // ------------------------------------------------------------

    public function test_an_archived_animal_can_be_restored()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $animal->weights()->create(['weight_kg' => 10, 'measured_at' => now()]);
        $animal->delete();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/restore");

        $response->assertStatus(200)->assertJson(['is_archived' => false]);
        $this->assertDatabaseHas('animals', ['id' => $animal->id, 'deleted_at' => null]);
    }

    public function test_restoring_a_non_archived_animal_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/restore")->assertStatus(400);
    }

    public function test_another_farm_cannot_restore_this_farms_animal()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $animal = $this->animal($farm);
        $animal->weights()->create(['weight_kg' => 10, 'measured_at' => now()]);
        $animal->delete();

        $this->actingAs($intruder, 'sanctum')->postJson("/api/animals/{$animal->id}/restore")->assertStatus(404);
    }

    public function test_a_tag_from_an_archived_animal_can_be_reused()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['tag' => 'REUSE-1']);
        $animal->weights()->create(['weight_kg' => 10, 'measured_at' => now()]);
        $animal->delete();

        $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'NewHolder', 'sex' => 'female', 'age' => 1, 'tag' => 'REUSE-1',
        ])->assertStatus(201);
    }

    // ------------------------------------------------------------
    // Death / sale exit
    // ------------------------------------------------------------

    public function test_death_and_sale_exits_are_recorded_without_setting_is_sacrificed()
    {
        [$user, $farm] = $this->farmOwner();
        $died = $this->animal($farm, ['name' => 'Died']);
        $sold = $this->animal($farm, ['name' => 'Sold']);

        $deathResponse = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$died->id}/exit", [
            'reason' => 'death', 'exit_date' => now()->toDateString(),
        ]);
        $deathResponse->assertStatus(200)->assertJson(['exit_reason' => 'death', 'is_sacrificed' => false]);

        $saleResponse = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$sold->id}/exit", [
            'reason' => 'sale', 'exit_date' => now()->toDateString(),
        ]);
        $saleResponse->assertStatus(200)->assertJson(['exit_reason' => 'sale', 'is_sacrificed' => false]);

        $this->assertDatabaseHas('animals', ['id' => $died->id, 'exit_reason' => 'death', 'is_sacrificed' => false]);
    }

    public function test_cannot_exit_an_animal_that_has_already_exited()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/exit", [
            'reason' => 'death', 'exit_date' => now()->toDateString(),
        ]);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/exit", [
            'reason' => 'sale', 'exit_date' => now()->toDateString(),
        ])->assertStatus(400);
    }

    public function test_cannot_sacrifice_an_animal_that_already_exited_by_death_or_sale()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['sex' => 'male']);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/exit", [
            'reason' => 'death', 'exit_date' => now()->toDateString(),
        ]);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/sacrifice")->assertStatus(400);
    }

    public function test_cannot_feed_or_groom_an_exited_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/exit", [
            'reason' => 'sale', 'exit_date' => now()->toDateString(),
        ]);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feed")->assertStatus(400);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/groom")->assertStatus(400);
    }

    /**
     * Regression: the existing sacrifice flow (message, status codes,
     * response shape) must be byte-for-byte unchanged by the broader
     * hasExited() check added alongside it.
     */
    public function test_existing_sacrifice_flow_is_unaffected()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['sex' => 'male']);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/sacrifice");
        $response->assertStatus(200)->assertJson(['is_sacrificed' => true, 'exit_reason' => 'sacrifice']);

        $again = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/sacrifice");
        $again->assertStatus(400)->assertJson(['error' => 'Animal has already been sacrificed']);
    }
}
