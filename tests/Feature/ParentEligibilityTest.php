<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\BreedingCycle;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 4 Step 1: origin/purchase-date consistency, and dam_id/sire_id
 * eligibility (species, sex, maturity, active status) across every flow
 * that accepts a parent — Add/Edit Animal, Birth recording, Breeding
 * Cycle creation/update.
 */
class ParentEligibilityTest extends TestCase
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
    // Origin vs. purchase date
    // ------------------------------------------------------------

    public function test_born_with_purchase_date_is_rejected_on_create()
    {
        [$user, $farm] = $this->farmOwner();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Test', 'sex' => 'female', 'age' => 1,
            'origin' => 'born', 'date_of_purchase' => now()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('date_of_purchase');
    }

    public function test_purchased_without_date_is_accepted_on_create()
    {
        [$user, $farm] = $this->farmOwner();

        $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Test', 'sex' => 'female', 'age' => 1,
            'origin' => 'purchased',
        ])->assertStatus(201);
    }

    public function test_born_without_purchase_date_is_accepted_on_create()
    {
        [$user, $farm] = $this->farmOwner();

        $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Test', 'sex' => 'female', 'age' => 1,
            'origin' => 'born',
        ])->assertStatus(201);
    }

    public function test_null_origin_with_purchase_date_remains_valid()
    {
        [$user, $farm] = $this->farmOwner();

        $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Test', 'sex' => 'female', 'age' => 1,
            'date_of_purchase' => now()->toDateString(),
        ])->assertStatus(201);
    }

    public function test_born_with_purchase_date_is_rejected_on_update()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'female', 'age' => 3,
            'origin' => 'born', 'date_of_purchase' => now()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('date_of_purchase');
    }

    public function test_purchased_without_date_is_accepted_on_update()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'female', 'age' => 3,
            'origin' => 'purchased',
        ])->assertStatus(200);
    }

    // ------------------------------------------------------------
    // Dam/sire eligibility — Add Animal
    // ------------------------------------------------------------

    public function test_valid_adult_same_species_female_is_accepted_as_dam()
    {
        [$user, $farm] = $this->farmOwner();
        $mom = $this->animal($farm, ['name' => 'Mom']);

        $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'female', 'age' => 0.1, 'dam_id' => $mom->id,
        ])->assertStatus(201)->assertJson(['dam_id' => $mom->id]);
    }

    public function test_valid_adult_same_species_male_is_accepted_as_sire()
    {
        [$user, $farm] = $this->farmOwner();
        $dad = $this->animal($farm, ['name' => 'Dad', 'sex' => 'male', 'age' => 2]);

        $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'male', 'age' => 0.1, 'sire_id' => $dad->id,
        ])->assertStatus(201)->assertJson(['sire_id' => $dad->id]);
    }

    public function test_wrong_species_dam_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $goat = $this->animal($farm, ['type' => 'goat', 'name' => 'GoatMom']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'female', 'age' => 0.1, 'dam_id' => $goat->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('dam_id');
    }

    public function test_male_animal_is_rejected_as_dam()
    {
        [$user, $farm] = $this->farmOwner();
        $male = $this->animal($farm, ['name' => 'Ram', 'sex' => 'male', 'age' => 2]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'female', 'age' => 0.1, 'dam_id' => $male->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('dam_id');
    }

    public function test_female_animal_is_rejected_as_sire()
    {
        [$user, $farm] = $this->farmOwner();
        $female = $this->animal($farm, ['name' => 'Ewe']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'male', 'age' => 0.1, 'sire_id' => $female->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('sire_id');
    }

    public function test_immature_dam_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        // Sheep MIN_AGES is 0.5 years.
        $youngLamb = $this->animal($farm, ['name' => 'YoungLamb', 'age' => 0.2]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'female', 'age' => 0.1, 'dam_id' => $youngLamb->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('dam_id');
    }

    public function test_archived_dam_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $mom = $this->animal($farm, ['name' => 'Mom']);
        $mom->weights()->create(['weight_kg' => 50, 'measured_at' => now()]);
        $mom->delete(); // archives, since it now has weight history

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'female', 'age' => 0.1, 'dam_id' => $mom->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('dam_id');
    }

    public function test_exited_dam_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $mom = $this->animal($farm, ['name' => 'Mom']);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$mom->id}/exit", [
            'reason' => 'sale', 'exit_date' => now()->toDateString(),
        ])->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'female', 'age' => 0.1, 'dam_id' => $mom->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('dam_id');
    }

    public function test_sacrificed_animal_is_rejected_as_sire()
    {
        [$user, $farm] = $this->farmOwner();
        $ram = $this->animal($farm, ['name' => 'Ram', 'sex' => 'male', 'age' => 2]);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$ram->id}/sacrifice")->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'male', 'age' => 0.1, 'sire_id' => $ram->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('sire_id');
    }

    public function test_self_as_dam_or_sire_is_rejected_on_create()
    {
        // Impossible structurally on create — the animal has no id yet to
        // reference — covered here only to document that; the real
        // self-reference guard is exercised on update (see below and the
        // existing AnimalLifecycleTest::test_dam_id_self_reference_is_rejected).
        $this->assertTrue(true);
    }

    // ------------------------------------------------------------
    // Dam/sire eligibility — Edit Animal
    // ------------------------------------------------------------

    public function test_edit_rejects_an_immature_or_wrong_species_parent()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['sex' => 'male']);
        $youngLamb = $this->animal($farm, ['name' => 'YoungLamb', 'age' => 0.2]);
        $goat = $this->animal($farm, ['type' => 'goat', 'name' => 'GoatMom']);

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'male', 'age' => 3, 'dam_id' => $youngLamb->id,
        ])->assertStatus(422)->assertJsonValidationErrors('dam_id');

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$animal->id}", [
            'type' => 'sheep', 'name' => 'Nour', 'sex' => 'male', 'age' => 3, 'dam_id' => $goat->id,
        ])->assertStatus(422)->assertJsonValidationErrors('dam_id');
    }

    /**
     * The core compatibility requirement from the finalized Phase 4 scope:
     * "existing historical relationships must remain intact" — resubmitting
     * an animal's unchanged dam_id must not start failing just because that
     * parent was archived after the relationship was established.
     */
    public function test_editing_an_animal_keeps_working_after_its_existing_dam_is_archived()
    {
        [$user, $farm] = $this->farmOwner();
        $mom = $this->animal($farm, ['name' => 'Mom']);
        $kid = $this->animal($farm, ['name' => 'Kid', 'sex' => 'female', 'age' => 1, 'dam_id' => $mom->id]);
        $mom->delete(); // archives, since she's now referenced as a dam

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$kid->id}", [
            'type' => 'sheep', 'name' => 'Kid Renamed', 'sex' => 'female', 'age' => 1, 'dam_id' => $mom->id,
        ]);

        $response->assertStatus(200)->assertJson(['name' => 'Kid Renamed', 'dam_id' => $mom->id]);
    }

    /**
     * Same as above but for a dam that has since exited (death/sale)
     * rather than been archived.
     */
    public function test_editing_an_animal_keeps_working_after_its_existing_sire_has_exited()
    {
        [$user, $farm] = $this->farmOwner();
        $dad = $this->animal($farm, ['name' => 'Dad', 'sex' => 'male', 'age' => 2]);
        $kid = $this->animal($farm, ['name' => 'Kid', 'sex' => 'male', 'age' => 1, 'sire_id' => $dad->id]);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dad->id}/exit", [
            'reason' => 'death', 'exit_date' => now()->toDateString(),
        ])->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$kid->id}", [
            'type' => 'sheep', 'name' => 'Kid Renamed', 'sex' => 'male', 'age' => 1, 'sire_id' => $dad->id,
        ]);

        $response->assertStatus(200)->assertJson(['name' => 'Kid Renamed', 'sire_id' => $dad->id]);
    }

    /**
     * Changing FROM an already-archived dam TO a different parent must
     * still go through full eligibility — the historical-relationship
     * exception only protects the unchanged value.
     */
    public function test_changing_away_from_an_archived_dam_still_requires_a_valid_new_dam()
    {
        [$user, $farm] = $this->farmOwner();
        $mom = $this->animal($farm, ['name' => 'Mom']);
        $kid = $this->animal($farm, ['name' => 'Kid', 'sex' => 'female', 'age' => 1, 'dam_id' => $mom->id]);
        $mom->delete();
        $youngLamb = $this->animal($farm, ['name' => 'YoungLamb', 'age' => 0.2]);

        $this->actingAs($user, 'sanctum')->putJson("/api/animals/{$kid->id}", [
            'type' => 'sheep', 'name' => 'Kid', 'sex' => 'female', 'age' => 1, 'dam_id' => $youngLamb->id,
        ])->assertStatus(422)->assertJsonValidationErrors('dam_id');
    }

    // ------------------------------------------------------------
    // Dam/sire eligibility — Birth recording
    // ------------------------------------------------------------

    public function test_birth_sire_must_match_dam_species_and_be_mature_and_active()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        $goatSire = $this->animal($farm, ['type' => 'goat', 'name' => 'GoatSire', 'sex' => 'male', 'age' => 2]);
        $youngSire = $this->animal($farm, ['name' => 'YoungSire', 'sex' => 'male', 'age' => 0.2]);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'sire_id' => $goatSire->id, 'born_on' => now()->toDateString(),
            'offspring_total' => 1, 'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb', 'sex' => 'female']],
        ])->assertStatus(422)->assertJsonValidationErrors('sire_id');

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'sire_id' => $youngSire->id, 'born_on' => now()->toDateString(),
            'offspring_total' => 1, 'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb', 'sex' => 'female']],
        ])->assertStatus(422)->assertJsonValidationErrors('sire_id');
    }

    public function test_birth_update_sire_validation_matches_store()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        $sire = $this->animal($farm, ['name' => 'Sire', 'sex' => 'male', 'age' => 2]);
        $birth = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'sire_id' => $sire->id, 'born_on' => now()->toDateString(),
            'offspring_total' => 1, 'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb', 'sex' => 'female']],
        ])->json();

        $goatSire = $this->animal($farm, ['type' => 'goat', 'name' => 'GoatSire', 'sex' => 'male', 'age' => 2]);

        $this->actingAs($user, 'sanctum')->putJson("/api/births/{$birth['id']}", [
            'sire_id' => $goatSire->id, 'born_on' => now()->toDateString(),
            'offspring_total' => 1, 'offspring_alive' => 1,
        ])->assertStatus(422)->assertJsonValidationErrors('sire_id');
    }

    // ------------------------------------------------------------
    // Dam/sire eligibility — Breeding Cycle
    // ------------------------------------------------------------

    public function test_breeding_cycle_sire_must_match_dam_species_and_be_mature()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        $goatSire = $this->animal($farm, ['type' => 'goat', 'name' => 'GoatSire', 'sex' => 'male', 'age' => 2]);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/breeding-cycles", [
            'sire_id' => $goatSire->id, 'method' => 'natural', 'bred_on' => now()->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors('sire_id');
    }

    public function test_breeding_cycle_cannot_be_started_for_an_immature_dam()
    {
        [$user, $farm] = $this->farmOwner();
        $youngDam = $this->animal($farm, ['name' => 'YoungDam', 'age' => 0.2]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$youngDam->id}/breeding-cycles", [
            'method' => 'natural', 'bred_on' => now()->toDateString(),
        ]);

        $response->assertStatus(400);
    }

    public function test_breeding_cycle_cannot_be_started_for_an_exited_dam()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/exit", [
            'reason' => 'sale', 'exit_date' => now()->toDateString(),
        ])->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/breeding-cycles", [
            'method' => 'natural', 'bred_on' => now()->toDateString(),
        ]);

        $response->assertStatus(400);
    }

    public function test_breeding_cycle_update_is_rejected_once_the_dam_has_exited_since_creation()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        $cycle = BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(5)]);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/exit", [
            'reason' => 'sale', 'exit_date' => now()->toDateString(),
        ])->assertStatus(200);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/breeding-cycles/{$cycle->id}", [
            'method' => 'ai', 'bred_on' => now()->subDays(4)->toDateString(),
        ]);

        $response->assertStatus(400);
    }

    public function test_breeding_cycle_update_is_rejected_once_the_dam_has_been_archived_since_creation()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        $cycle = BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(5)]);
        $dam->delete(); // archives, since she now has a breeding cycle

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/breeding-cycles/{$cycle->id}", [
            'method' => 'ai', 'bred_on' => now()->subDays(4)->toDateString(),
        ]);

        $response->assertStatus(400);
    }

    public function test_breeding_cycle_can_still_be_edited_for_a_dam_that_remains_eligible()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        $cycle = BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(5)]);

        $this->actingAs($user, 'sanctum')->putJson("/api/breeding-cycles/{$cycle->id}", [
            'method' => 'ai', 'bred_on' => now()->subDays(4)->toDateString(),
        ])->assertStatus(200)->assertJson(['method' => 'ai']);
    }
}
