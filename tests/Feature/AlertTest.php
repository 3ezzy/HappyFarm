<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Birth;
use App\Models\BreedingCycle;
use App\Models\Farm;
use App\Models\HealthRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AlertTest extends TestCase
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

    public function test_breeding_check_due_fires_once_overdue_and_not_before()
    {
        [$user, $farm] = $this->farmOwner();
        $dueSoonDam = $this->dam($farm, ['name' => 'DueSoon']);
        BreedingCycle::create([
            'animal_id' => $dueSoonDam->id,
            'method' => 'natural',
            'bred_on' => Carbon::today()->subDays(50), // 45-day check window + 5-day lead = overdue
        ]);

        $notYetDam = $this->dam($farm, ['name' => 'NotYet']);
        BreedingCycle::create([
            'animal_id' => $notYetDam->id,
            'method' => 'natural',
            'bred_on' => Carbon::today()->subDays(5), // nowhere near due
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');

        $response->assertStatus(200)->assertJsonCount(1);
        $response->assertJsonFragment(['type' => 'breeding_check_due', 'animal_id' => $dueSoonDam->id]);
    }

    public function test_days_until_is_negative_when_overdue_and_positive_when_upcoming()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        BreedingCycle::create([
            'animal_id' => $dam->id,
            'method' => 'natural',
            'bred_on' => Carbon::today()->subDays(50), // check due 5 days ago
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');
        $response->assertStatus(200);
        $this->assertSame(-5, $response->json('0.days_until'));
    }

    public function test_lambing_due_only_fires_once_pregnant()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        BreedingCycle::create([
            'animal_id' => $dam->id,
            'method' => 'natural',
            'bred_on' => Carbon::today()->subDays(200), // way past gestation, but never confirmed pregnant
        ]);

        // Still pending, not pregnant -> a breeding_check_due alert, never lambing_due.
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');
        $response->assertJsonMissing(['type' => 'lambing_due']);
        $response->assertJsonFragment(['type' => 'breeding_check_due']);
    }

    public function test_weaning_due_uses_the_dams_species_weaning_window()
    {
        [$user, $farm] = $this->farmOwner();
        $cow = $this->dam($farm, ['type' => 'cow', 'name' => 'Bessie']);
        $cycle = BreedingCycle::create([
            'animal_id' => $cow->id,
            'method' => 'natural',
            'bred_on' => Carbon::today()->subDays(300),
            'pregnancy_result' => 'pregnant',
        ]);
        Birth::create([
            'breeding_cycle_id' => $cycle->id,
            'dam_id' => $cow->id,
            'born_on' => Carbon::today()->subDays(BreedingCycle::SPECIES_RULES['cow']['weaning_days'] + 1),
            'offspring_total' => 1,
            'offspring_alive' => 1,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');
        $response->assertJsonFragment(['type' => 'weaning_due', 'animal_id' => $cow->id]);
    }

    public function test_reinsemination_due_is_anchored_to_weaning_not_birth()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $cycle = BreedingCycle::create([
            'animal_id' => $dam->id,
            'method' => 'natural',
            'bred_on' => Carbon::today()->subDays(300),
            'pregnancy_result' => 'pregnant',
            'weaned_on' => Carbon::today()->subDays(50), // 45-day rest window + 5-day lead = overdue
        ]);
        Birth::create([
            'breeding_cycle_id' => $cycle->id,
            'dam_id' => $dam->id,
            'born_on' => Carbon::today()->subDays(160), // irrelevant to the calculation
            'offspring_total' => 1,
            'offspring_alive' => 1,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');

        $response->assertJsonFragment(['type' => 'reinsemination_due', 'animal_id' => $dam->id]);
        // Expected due date must be weaned_on + rest_days, not born_on + rest_days.
        $expected = Carbon::today()->subDays(50)->addDays(BreedingCycle::SPECIES_RULES['sheep']['rebreed_rest_days'])->toDateString();
        $this->assertSame($expected, $response->json('0.due_on'));
    }

    public function test_nursing_dam_gets_weaning_due_not_reinsemination_due()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $cycle = BreedingCycle::create([
            'animal_id' => $dam->id,
            'method' => 'natural',
            'bred_on' => Carbon::today()->subDays(300),
            'pregnancy_result' => 'pregnant',
            // weaned_on intentionally left null — still nursing
        ]);
        Birth::create([
            'breeding_cycle_id' => $cycle->id,
            'dam_id' => $dam->id,
            'born_on' => Carbon::today()->subDays(100),
            'offspring_total' => 1,
            'offspring_alive' => 1,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');

        $response->assertJsonFragment(['type' => 'weaning_due']);
        $response->assertJsonMissing(['type' => 'reinsemination_due']);
    }

    public function test_health_due_uses_the_most_recent_record_of_its_kind()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->dam($farm);

        HealthRecord::create([
            'animal_id' => $animal->id,
            'kind' => 'vaccine',
            'administered_on' => Carbon::today()->subMonths(12),
            'next_due_on' => Carbon::today()->subMonths(6), // stale, superseded below
        ]);
        $latest = HealthRecord::create([
            'animal_id' => $animal->id,
            'kind' => 'vaccine',
            'administered_on' => Carbon::today()->subMonths(1),
            'next_due_on' => Carbon::today()->subDay(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');

        $response->assertJsonCount(1);
        $response->assertJsonFragment(['health_record_id' => $latest->id]);
    }

    public function test_sacrificed_animals_produce_no_alerts()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm, [
            'sacrificed_at' => now(),
            'exit_date' => now(),
            'exit_reason' => 'sacrifice',
        ]);
        BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => Carbon::today()->subDays(50)]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/alerts');
        $response->assertStatus(200)->assertJsonCount(0);
    }

    public function test_dismissing_an_alert_removes_only_that_occurrence()
    {
        [$user, $farm] = $this->farmOwner();
        $dam1 = $this->dam($farm, ['name' => 'Dam1']);
        $dam2 = $this->dam($farm, ['name' => 'Dam2']);
        BreedingCycle::create(['animal_id' => $dam1->id, 'method' => 'natural', 'bred_on' => Carbon::today()->subDays(50)]);
        BreedingCycle::create(['animal_id' => $dam2->id, 'method' => 'natural', 'bred_on' => Carbon::today()->subDays(50)]);

        $before = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $this->assertCount(2, $before);

        $keyToDismiss = $before[0]['key'];
        $this->actingAs($user, 'sanctum')->postJson('/api/alerts/dismiss', ['key' => $keyToDismiss])
            ->assertStatus(200);

        $after = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $this->assertCount(1, $after);
        $this->assertNotSame($keyToDismiss, $after[0]['key']);
    }

    public function test_dismiss_is_idempotent()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => Carbon::today()->subDays(50)]);

        $key = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json('0.key');

        $this->actingAs($user, 'sanctum')->postJson('/api/alerts/dismiss', ['key' => $key])->assertStatus(200);
        $this->actingAs($user, 'sanctum')->postJson('/api/alerts/dismiss', ['key' => $key])->assertStatus(200);

        $this->assertDatabaseCount('alert_dismissals', 1);
    }

    public function test_another_farms_alerts_are_never_visible()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder, $intruderFarm] = $this->farmOwner();
        $dam = $this->dam($farm);
        BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => Carbon::today()->subDays(50)]);

        $response = $this->actingAs($intruder, 'sanctum')->getJson('/api/alerts');
        $response->assertStatus(200)->assertJsonCount(0);
    }
}
