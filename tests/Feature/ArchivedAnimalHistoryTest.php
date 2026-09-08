<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Archiving means read-only, not invisible: an archived animal's weight,
 * health, feeding-cost, breeding-cycle, and birth history must stay
 * viewable (matching what AnimalDetails.jsx renders unconditionally for
 * every animal, archived or not), while every write action on those
 * same sub-resources stays exactly as blocked as before. See
 * WeightController::findOwnedAnimal() and its siblings for the fix.
 */
class ArchivedAnimalHistoryTest extends TestCase
{
    use RefreshDatabase;

    private function farmOwner(): array
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => $user->name . "'s Farm"]);

        return [$user, $farm];
    }

    private function dam(Farm $farm, array $overrides = []): Animal
    {
        return Animal::create(array_merge([
            'farm_id' => $farm->id,
            'type' => 'sheep',
            'name' => 'Nour',
            'sex' => 'female',
            'age' => 3,
        ], $overrides));
    }

    public function test_active_animals_historical_endpoints_work_normally()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->weights()->create(['weight_kg' => 40, 'measured_at' => now()]);
        $dam->healthRecords()->create(['kind' => 'vaccine', 'administered_on' => now()]);

        $actor = $this->actingAs($user, 'sanctum');
        $actor->getJson("/api/animals/{$dam->id}/weights")->assertStatus(200)->assertJsonCount(1);
        $actor->getJson("/api/animals/{$dam->id}/health-records")->assertStatus(200)->assertJsonCount(1);
        $actor->getJson("/api/animals/{$dam->id}/feeding-costs")->assertStatus(200)->assertJsonCount(0);
        $actor->getJson("/api/animals/{$dam->id}/breeding-cycles")->assertStatus(200)->assertJsonCount(0);
        $actor->getJson("/api/animals/{$dam->id}/births")->assertStatus(200)->assertJsonCount(0);
    }

    public function test_weight_history_remains_readable_after_archiving()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->weights()->create(['weight_kg' => 40, 'measured_at' => now()]);
        $dam->delete();

        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$dam->id}/weights")
            ->assertStatus(200)->assertJsonCount(1)->assertJsonPath('0.weight_kg', 40);
    }

    public function test_weight_cannot_be_added_to_an_archived_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->weights()->create(['weight_kg' => 40, 'measured_at' => now()]);
        $dam->delete();

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/weights", [
            'weight_kg' => 45, 'measured_at' => now()->toDateString(),
        ])->assertStatus(404);
    }

    public function test_health_records_remain_readable_after_archiving()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->healthRecords()->create(['kind' => 'vaccine', 'administered_on' => now()]);
        $dam->delete();

        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$dam->id}/health-records")
            ->assertStatus(200)->assertJsonCount(1);
    }

    public function test_health_record_cannot_be_added_to_an_archived_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->healthRecords()->create(['kind' => 'vaccine', 'administered_on' => now()]);
        $dam->delete();

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/health-records", [
            'kind' => 'vitamin', 'administered_on' => now()->toDateString(),
        ])->assertStatus(404);
    }

    public function test_feeding_cost_history_remains_readable_after_archiving()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => now()->subDays(3)->toDateString(),
        ])->assertStatus(201);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$dam->id}")
            ->assertStatus(200)->assertJson(['action' => 'archived']);

        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$dam->id}/feeding-costs")
            ->assertStatus(200)->assertJsonCount(1)->assertJsonPath('0.daily_cost', 2);

        // The frozen total on the animal payload itself must agree with
        // the now-visible period list — same number, two different routes.
        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$dam->id}")
            ->assertJsonPath('total_feeding_cost', 8);
    }

    public function test_feeding_cost_cannot_be_set_on_an_archived_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->weights()->create(['weight_kg' => 40, 'measured_at' => now()]); // give it history so delete() archives
        $dam->delete();

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/feeding-costs", [
            'daily_cost' => 2,
        ])->assertStatus(404);
    }

    public function test_breeding_cycles_remain_readable_after_archiving()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        \App\Models\BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(5)]);
        $dam->delete();

        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$dam->id}/breeding-cycles")
            ->assertStatus(200)->assertJsonCount(1);
    }

    public function test_breeding_cycle_cannot_be_started_for_an_archived_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->weights()->create(['weight_kg' => 40, 'measured_at' => now()]);
        $dam->delete();

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/breeding-cycles", [
            'method' => 'natural', 'bred_on' => now()->toDateString(),
        ])->assertStatus(404);
    }

    public function test_births_remain_readable_after_archiving()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->births()->create(['born_on' => now()->subDays(5), 'offspring_total' => 1, 'offspring_alive' => 1]);
        $dam->delete();

        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$dam->id}/births")
            ->assertStatus(200)->assertJsonCount(1);
    }

    public function test_birth_cannot_be_recorded_for_an_archived_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->weights()->create(['weight_kg' => 40, 'measured_at' => now()]);
        $dam->delete();

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 1,
            'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb', 'sex' => 'female']],
        ])->assertStatus(404);
    }

    /**
     * Restore is already covered extensively elsewhere (AnimalLifecycleTest);
     * this specifically confirms write access to a sub-resource resumes,
     * not just that read access was never broken.
     */
    public function test_restoring_reactivates_write_access_to_historical_endpoints()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->weights()->create(['weight_kg' => 40, 'measured_at' => now()]);
        $dam->delete();

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/weights", [
            'weight_kg' => 45, 'measured_at' => now()->toDateString(),
        ])->assertStatus(404);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/restore")->assertStatus(200);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/weights", [
            'weight_kg' => 45, 'measured_at' => now()->toDateString(),
        ])->assertStatus(201);
    }

    /**
     * A sacrificed-but-not-archived animal is a different state entirely
     * (trashed() is false). Feeding-cost writes are explicitly blocked via
     * hasExited(); weight/health-record writes have no such check today and
     * this fix must not silently add one — both behaviors are pinned here
     * exactly as they already were before this change.
     */
    public function test_sacrificed_but_not_archived_animal_keeps_existing_restrictions()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/sacrifice")->assertStatus(200);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/feeding-costs", [
            'daily_cost' => 2,
        ])->assertStatus(400);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/weights", [
            'weight_kg' => 40, 'measured_at' => now()->toDateString(),
        ])->assertStatus(201);
    }

    public function test_another_farm_cannot_read_historical_data_for_an_archived_animal()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $dam = $this->dam($farm);
        $dam->weights()->create(['weight_kg' => 40, 'measured_at' => now()]);
        $dam->delete();

        $this->actingAs($intruder, 'sanctum')->getJson("/api/animals/{$dam->id}/weights")->assertStatus(404);
        $this->actingAs($intruder, 'sanctum')->getJson("/api/animals/{$dam->id}/feeding-costs")->assertStatus(404);
    }
}
