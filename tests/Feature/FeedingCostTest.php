<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Farm;
use App\Models\FeedingCost;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeedingCostTest extends TestCase
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
            'sex' => 'male',
            'age' => 3,
        ], $overrides));
    }

    // ------------------------------------------------------------
    // Creating / listing periods
    // ------------------------------------------------------------

    public function test_first_period_is_created_and_listed()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2,
            'effective_from' => '2026-09-01',
        ])->assertStatus(201)->assertJson([
            'daily_cost' => 2.0,
            'effective_from' => '2026-09-01',
            'effective_until' => null,
        ]);

        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal->id}/feeding-costs")
            ->assertStatus(200)->assertJsonCount(1);
    }

    public function test_effective_from_defaults_to_today_when_omitted()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2,
        ])->assertStatus(201)->assertJson(['effective_from' => now()->toDateString()]);
    }

    public function test_effective_from_cannot_precede_date_of_birth()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['date_of_birth' => now()->subYear()]);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2,
            'effective_from' => now()->subYears(2)->toDateString(),
        ])->assertStatus(422)->assertJsonValidationErrors('effective_from');
    }

    public function test_negative_daily_cost_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => -1,
        ])->assertStatus(422)->assertJsonValidationErrors('daily_cost');
    }

    // ------------------------------------------------------------
    // Changing the rate
    // ------------------------------------------------------------

    public function test_changing_cost_closes_the_prior_period_and_opens_a_new_one()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $this->travelTo(Carbon::parse('2026-09-10'));

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => '2026-09-01',
        ])->assertStatus(201);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 3, 'effective_from' => '2026-09-08',
        ])->assertStatus(201)->assertJson([
            'daily_cost' => 3.0, 'effective_from' => '2026-09-08', 'effective_until' => null,
        ]);

        $this->assertDatabaseHas('feeding_costs', [
            'animal_id' => $animal->id, 'daily_cost' => 2.00,
            'effective_from' => '2026-09-01 00:00:00', 'effective_until' => '2026-09-07 00:00:00',
        ]);
        $this->assertSame(2, FeedingCost::where('animal_id', $animal->id)->count());
    }

    public function test_same_day_second_change_collapses_into_one_row()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $today = now()->toDateString();

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => $today,
        ])->assertStatus(201);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 3, 'effective_from' => $today,
        ])->assertStatus(201);

        $this->assertSame(1, FeedingCost::where('animal_id', $animal->id)->count());
        $this->assertDatabaseHas('feeding_costs', ['animal_id' => $animal->id, 'daily_cost' => 3.00]);
    }

    public function test_effective_from_before_the_open_periods_start_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $this->travelTo(Carbon::parse('2026-09-10'));

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => '2026-09-08',
        ])->assertStatus(201);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 3, 'effective_from' => '2026-09-01',
        ])->assertStatus(422)->assertJsonValidationErrors('effective_from');
    }

    // ------------------------------------------------------------
    // Totals
    // ------------------------------------------------------------

    public function test_total_feeding_cost_matches_the_worked_example()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->travelTo(Carbon::parse('2026-09-01'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => '2026-09-01',
        ])->assertStatus(201);

        $this->travelTo(Carbon::parse('2026-09-08'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 3, 'effective_from' => '2026-09-08',
        ])->assertStatus(201);

        // 4 days into the second period: Sep 8, 9, 10, 11.
        $this->travelTo(Carbon::parse('2026-09-11'));

        // 2 DH x 7 days (Sep 1-7) + 3 DH x 4 days (Sep 8-11) = 14 + 12 = 26.
        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal->id}")
            ->assertJson(['current_daily_cost' => 3.0, 'total_feeding_cost' => 26.0]);
    }

    // ------------------------------------------------------------
    // Lifecycle: exit is a permanent freeze
    // ------------------------------------------------------------

    public function test_cost_cannot_be_set_on_an_animal_that_has_exited()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/exit", [
            'reason' => 'sale', 'exit_date' => now()->toDateString(),
        ])->assertStatus(200);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2,
        ])->assertStatus(400);
    }

    public function test_sacrificing_closes_the_open_period_at_the_exit_date()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->travelTo(Carbon::parse('2026-09-01'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => '2026-09-01',
        ]);

        $this->travelTo(Carbon::parse('2026-09-05'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/sacrifice")->assertStatus(200);

        $this->assertDatabaseHas('feeding_costs', ['animal_id' => $animal->id, 'effective_until' => '2026-09-05 00:00:00']);
    }

    public function test_recording_a_death_or_sale_exit_closes_the_open_period()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['sex' => 'female']);

        $this->travelTo(Carbon::parse('2026-09-01'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => '2026-09-01',
        ]);

        $this->travelTo(Carbon::parse('2026-09-04'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/exit", [
            'reason' => 'death', 'exit_date' => '2026-09-04',
        ])->assertStatus(200);

        $this->assertDatabaseHas('feeding_costs', ['animal_id' => $animal->id, 'effective_until' => '2026-09-04 00:00:00']);
    }

    public function test_total_feeding_cost_freezes_after_exit_even_as_time_passes()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm, ['sex' => 'female']);

        $this->travelTo(Carbon::parse('2026-09-01'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => '2026-09-01',
        ]);

        $this->travelTo(Carbon::parse('2026-09-05'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/exit", [
            'reason' => 'sale', 'exit_date' => '2026-09-05',
        ]);

        // Sep 1-5 inclusive = 5 days x 2 DH = 10.
        $before = $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal->id}")->json();
        $this->assertEquals(10.0, $before['total_feeding_cost']);

        $this->travelTo(Carbon::parse('2026-09-20'));
        $after = $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal->id}")->json();
        $this->assertEquals(10.0, $after['total_feeding_cost']);
    }

    // ------------------------------------------------------------
    // Lifecycle: archive pauses, restore resumes
    // ------------------------------------------------------------

    public function test_archiving_pauses_accrual_and_restoring_resumes_it()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->travelTo(Carbon::parse('2026-09-01'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => '2026-09-01',
        ]);

        // Archived after 5 accrued days (Sep 1-5).
        $this->travelTo(Carbon::parse('2026-09-05'));
        $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}")
            ->assertStatus(200)->assertJson(['action' => 'archived']);
        $this->assertDatabaseHas('feeding_costs', ['animal_id' => $animal->id, 'effective_until' => '2026-09-05 00:00:00']);

        // Ten days pass while archived — total must stay frozen at 10.
        $this->travelTo(Carbon::parse('2026-09-15'));
        $frozen = $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal->id}")->json();
        $this->assertEquals(10.0, $frozen['total_feeding_cost']);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/restore")->assertStatus(200);

        // Five more days pass after restoring (Sep 15-20 inclusive = 6 days x 2 = 12).
        $this->travelTo(Carbon::parse('2026-09-20'));
        $resumed = $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal->id}")->json();
        $this->assertEquals(22.0, $resumed['total_feeding_cost']);
        $this->assertGreaterThan($frozen['total_feeding_cost'], $resumed['total_feeding_cost']);
    }

    public function test_archiving_and_restoring_on_the_same_day_reopens_the_same_period_without_error()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->travelTo(Carbon::parse('2026-09-01'));
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2, 'effective_from' => '2026-09-01',
        ]);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}")->assertStatus(200);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/restore")->assertStatus(200);

        $this->assertSame(1, FeedingCost::where('animal_id', $animal->id)->count());
        $this->assertDatabaseHas('feeding_costs', ['animal_id' => $animal->id, 'effective_until' => null]);
    }

    public function test_animal_with_only_feeding_cost_history_cannot_be_permanently_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", ['daily_cost' => 2]);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/animals/{$animal->id}")
            ->assertStatus(200)->assertJson(['action' => 'archived']);
        $this->assertSoftDeleted('animals', ['id' => $animal->id]);
    }

    // ------------------------------------------------------------
    // Immutability / authorization
    // ------------------------------------------------------------

    public function test_no_update_or_delete_route_exists_for_a_period()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $period = FeedingCost::create([
            'animal_id' => $animal->id, 'daily_cost' => 2, 'effective_from' => now()->toDateString(),
        ]);

        $this->actingAs($user, 'sanctum')->putJson("/api/feeding-costs/{$period->id}", ['daily_cost' => 3])
            ->assertStatus(404);
        $this->actingAs($user, 'sanctum')->deleteJson("/api/feeding-costs/{$period->id}")
            ->assertStatus(404);
    }

    public function test_another_farm_cannot_view_or_create_feeding_costs_for_this_farms_animal()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($intruder, 'sanctum')->getJson("/api/animals/{$animal->id}/feeding-costs")
            ->assertStatus(404);
        $this->actingAs($intruder, 'sanctum')->postJson("/api/animals/{$animal->id}/feeding-costs", [
            'daily_cost' => 2,
        ])->assertStatus(404);
    }
}
