<?php

namespace Tests\Feature;

use App\Models\AlertDismissal;
use App\Models\Animal;
use App\Models\Birth;
use App\Models\BreedingCycle;
use App\Models\Farm;
use App\Models\HealthRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FarmReportingTest extends TestCase
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

    private function stats($user)
    {
        return $this->actingAs($user, 'sanctum')->getJson('/api/farm/statistics')->json();
    }

    // ------------------------------------------------------------
    // Regression: existing fields unchanged
    // ------------------------------------------------------------

    public function test_existing_statistics_fields_are_unchanged_in_shape_and_value()
    {
        [$user, $farm] = $this->farmOwner();
        $this->animal($farm, ['type' => 'goat']);
        $sacrificed = $this->animal($farm, ['sex' => 'male']);
        $sacrificed->update(['is_sacrificed' => true, 'sacrificed_at' => now()]);

        $stats = $this->stats($user);

        $this->assertSame($farm->name, $stats['farm_name']);
        $this->assertSame(2, $stats['total_animals']);
        $this->assertSame(1, $stats['animals_by_type']['sheep']);
        $this->assertSame(1, $stats['animals_by_type']['goat']);
        $this->assertSame(1, $stats['sacrifice_status']['already_sacrificed']);
        $this->assertArrayHasKey('eligible_for_sacrifice', $stats['sacrifice_status']);
        $this->assertArrayHasKey('not_yet_eligible', $stats['sacrifice_status']);
        $this->assertArrayHasKey('recently_fed', $stats['care_status']);
        $this->assertArrayHasKey('recently_groomed', $stats['care_status']);
        $this->assertArrayHasKey('need_feeding', $stats['care_status']);
        $this->assertArrayHasKey('need_grooming', $stats['care_status']);
    }

    public function test_new_sections_are_present_and_zeroed_for_an_empty_farm()
    {
        [$user] = $this->farmOwner();

        $stats = $this->stats($user);

        $this->assertSame(['not_bred' => 0, 'bred' => 0, 'pregnant' => 0, 'nursing' => 0, 'available' => 0], $stats['breeding_status_counts']);
        $this->assertSame(0, $stats['breeding_performance']['total_births']);
        $this->assertNull($stats['breeding_performance']['weaning_rate']);
        // assertEquals, not assertSame: json_encode drops the fractional
        // part of whole-number floats (0.0 -> 0), so a decoded 0 and a
        // decoded 0.0 must compare loosely here, not by strict PHP type.
        $this->assertEquals(0.0, $stats['expense_summary']['total']);
        $this->assertCount(6, $stats['expense_summary']['by_month']);
        $this->assertSame([], $stats['expense_summary']['by_kind']);
        $this->assertSame(0, $stats['alert_summary']['total']);
    }

    // ------------------------------------------------------------
    // breeding_status_counts
    // ------------------------------------------------------------

    public function test_breeding_status_counts_reflects_each_animals_latest_cycle()
    {
        [$user, $farm] = $this->farmOwner();
        $this->animal($farm, ['name' => 'Unbred']);
        $bred = $this->animal($farm, ['name' => 'Bred']);
        BreedingCycle::create(['animal_id' => $bred->id, 'method' => 'natural', 'bred_on' => now()->subDays(10)]);

        $stats = $this->stats($user);

        $this->assertSame(1, $stats['breeding_status_counts']['not_bred']);
        $this->assertSame(1, $stats['breeding_status_counts']['bred']);
    }

    public function test_breeding_status_counts_excludes_sacrificed_animals()
    {
        [$user, $farm] = $this->farmOwner();
        $bred = $this->animal($farm, ['sex' => 'male']);
        BreedingCycle::create(['animal_id' => $bred->id, 'method' => 'natural', 'bred_on' => now()->subDays(10)]);
        $bred->update(['is_sacrificed' => true, 'sacrificed_at' => now()]);

        $stats = $this->stats($user);

        $this->assertSame(0, array_sum($stats['breeding_status_counts']));
    }

    public function test_breeding_status_counts_excludes_archived_animals()
    {
        [$user, $farm] = $this->farmOwner();
        $bred = $this->animal($farm);
        BreedingCycle::create(['animal_id' => $bred->id, 'method' => 'natural', 'bred_on' => now()->subDays(10)]);
        $bred->delete(); // archives, since it now has a breeding cycle

        $stats = $this->stats($user);

        $this->assertSame(0, array_sum($stats['breeding_status_counts']));
    }

    // ------------------------------------------------------------
    // breeding_performance — historical, includes archived dams
    // ------------------------------------------------------------

    public function test_breeding_performance_still_counts_an_archived_dams_cycle()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(10)]);
        $dam->delete();

        $stats = $this->stats($user);

        $this->assertSame(1, $stats['breeding_performance']['by_status']['bred']);
    }

    public function test_breeding_performance_weaning_rate_and_offspring_totals()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        $cycle = BreedingCycle::create([
            'animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(160),
            'pregnancy_result' => 'pregnant', 'pregnancy_check_on' => now()->subDays(100),
            'birthed_on' => now()->subDays(10),
        ]);
        Birth::create([
            'breeding_cycle_id' => $cycle->id, 'dam_id' => $dam->id,
            'born_on' => now()->subDays(10), 'offspring_total' => 3, 'offspring_alive' => 2,
        ]);

        $statsBeforeWeaning = $this->stats($user);
        $this->assertSame(1, $statsBeforeWeaning['breeding_performance']['total_births']);
        $this->assertSame(2, $statsBeforeWeaning['breeding_performance']['total_offspring_alive']);
        $this->assertSame(3, $statsBeforeWeaning['breeding_performance']['total_offspring_total']);
        $this->assertEquals(0.0, $statsBeforeWeaning['breeding_performance']['weaning_rate']);
        $this->assertSame(1, $statsBeforeWeaning['breeding_performance']['by_status']['lambed']);

        $cycle->update(['weaned_on' => now()]);
        $statsAfterWeaning = $this->stats($user);
        $this->assertEquals(100.0, $statsAfterWeaning['breeding_performance']['weaning_rate']);
    }

    public function test_breeding_performance_counts_a_birth_even_if_its_dam_is_now_archived()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        $cycle = BreedingCycle::create([
            'animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(160),
            'birthed_on' => now()->subDays(10),
        ]);
        Birth::create([
            'breeding_cycle_id' => $cycle->id, 'dam_id' => $dam->id,
            'born_on' => now()->subDays(10), 'offspring_total' => 1, 'offspring_alive' => 1,
        ]);
        $dam->delete();

        $stats = $this->stats($user);

        $this->assertSame(1, $stats['breeding_performance']['total_births']);
    }

    // ------------------------------------------------------------
    // expense_summary — historical, includes archived animals
    // ------------------------------------------------------------

    public function test_expense_summary_totals_and_groups_by_kind()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        HealthRecord::create(['animal_id' => $animal->id, 'kind' => 'vaccine', 'administered_on' => now(), 'cost' => 10.50]);
        HealthRecord::create(['animal_id' => $animal->id, 'kind' => 'vaccine', 'administered_on' => now(), 'cost' => 5.25]);
        HealthRecord::create(['animal_id' => $animal->id, 'kind' => 'surgery', 'administered_on' => now(), 'cost' => 100]);
        HealthRecord::create(['animal_id' => $animal->id, 'kind' => 'vitamin', 'administered_on' => now()]); // no cost

        $stats = $this->stats($user);

        $this->assertSame(115.75, $stats['expense_summary']['total']);
        $this->assertSame(15.75, $stats['expense_summary']['by_kind']['vaccine']);
        $this->assertEquals(100.0, $stats['expense_summary']['by_kind']['surgery']);
        $this->assertArrayNotHasKey('vitamin', $stats['expense_summary']['by_kind']);
    }

    public function test_expense_summary_includes_an_archived_animals_historical_cost()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        HealthRecord::create(['animal_id' => $animal->id, 'kind' => 'vaccine', 'administered_on' => now(), 'cost' => 42]);
        $animal->weights()->create(['weight_kg' => 10, 'measured_at' => now()]);
        $animal->delete(); // archives, since it now has weight history

        $stats = $this->stats($user);

        $this->assertEquals(42.0, $stats['expense_summary']['total']);
    }

    public function test_expense_summary_by_month_has_six_entries_and_places_cost_in_the_right_month()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        HealthRecord::create(['animal_id' => $animal->id, 'kind' => 'vaccine', 'administered_on' => now(), 'cost' => 30]);

        $stats = $this->stats($user);
        $byMonth = $stats['expense_summary']['by_month'];

        $this->assertCount(6, $byMonth);
        $thisMonth = now()->format('Y-m');
        $entry = collect($byMonth)->firstWhere('month', $thisMonth);
        $this->assertEquals(30.0, $entry['total']);
    }

    // ------------------------------------------------------------
    // alert_summary — thin wrapper around AlertGenerator
    // ------------------------------------------------------------

    public function test_alert_summary_counts_a_currently_due_alert()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        // sheep check_days=45, LEAD_DAYS=5 -> due once bred_on <= today-40
        BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(41)]);

        $stats = $this->stats($user);

        $this->assertSame(1, $stats['alert_summary']['total']);
        $this->assertSame(1, $stats['alert_summary']['by_type']['breeding_check_due']);
    }

    public function test_alert_summary_excludes_dismissed_alerts()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->animal($farm);
        BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(41)]);

        $before = $this->stats($user);
        $this->assertSame(1, $before['alert_summary']['total']);

        AlertDismissal::create([
            'farm_id' => $farm->id,
            'alert_key' => "breeding_check_due:{$dam->breedingCycles()->first()->id}",
            'dismissed_at' => now(),
        ]);

        $after = $this->stats($user);
        $this->assertSame(0, $after['alert_summary']['total']);
    }

    // ------------------------------------------------------------
    // Farm scoping — none of the four new sections leak across farms
    // ------------------------------------------------------------

    public function test_new_sections_are_scoped_to_the_authenticated_users_own_farm()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();

        $dam = $this->animal($farm);
        $cycle = BreedingCycle::create([
            'animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(160),
            'birthed_on' => now()->subDays(10),
        ]);
        Birth::create(['breeding_cycle_id' => $cycle->id, 'dam_id' => $dam->id, 'born_on' => now()->subDays(10), 'offspring_total' => 1, 'offspring_alive' => 1]);
        HealthRecord::create(['animal_id' => $dam->id, 'kind' => 'vaccine', 'administered_on' => now(), 'cost' => 50]);

        $intruderStats = $this->stats($intruder);

        $this->assertSame(0, array_sum($intruderStats['breeding_status_counts']));
        $this->assertSame(0, $intruderStats['breeding_performance']['total_births']);
        $this->assertEquals(0.0, $intruderStats['expense_summary']['total']);
        $this->assertSame(0, $intruderStats['alert_summary']['total']);
    }
}
