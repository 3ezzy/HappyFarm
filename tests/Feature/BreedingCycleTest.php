<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\BreedingCycle;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BreedingCycleTest extends TestCase
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

    private function sire(Farm $farm, array $overrides = []): Animal
    {
        return Animal::create(array_merge([
            'farm_id' => $farm->id,
            'type' => 'sheep',
            'name' => 'Ram',
            'sex' => 'male',
            'age' => 2,
        ], $overrides));
    }

    public function test_cycle_can_only_be_started_for_a_female_animal()
    {
        [$user, $farm] = $this->farmOwner();
        $male = $this->sire($farm);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$male->id}/breeding-cycles", [
            'method' => 'natural',
            'bred_on' => now()->toDateString(),
        ]);

        $response->assertStatus(400)->assertJson(['error' => 'Only female animals can be bred']);
    }

    public function test_cannot_start_a_second_open_cycle_for_the_same_dam()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/breeding-cycles", [
            'method' => 'natural',
            'bred_on' => now()->subDays(10)->toDateString(),
        ])->assertStatus(201);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/breeding-cycles", [
            'method' => 'natural',
            'bred_on' => now()->toDateString(),
        ]);

        $response->assertStatus(400)->assertJson(['error' => 'This animal already has an open breeding cycle']);
    }

    public function test_sire_must_be_male_and_on_the_same_farm()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $notASire = $this->dam($farm, ['name' => 'AlsoFemale']);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/breeding-cycles", [
            'sire_id' => $notASire->id,
            'method' => 'natural',
            'bred_on' => now()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('sire_id');
    }

    public function test_full_breeding_status_state_machine()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $sire = $this->sire($farm);

        $this->assertSame('not_bred', $dam->fresh()->breeding_status);

        $cycle = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/breeding-cycles", [
            'sire_id' => $sire->id,
            'method' => 'natural',
            'bred_on' => now()->subDays(50)->toDateString(),
        ])->json();

        $this->assertSame('bred', $dam->fresh()->breeding_status);
        $this->assertSame('pending', $cycle['pregnancy_result']); // DB default reflected, not left null

        $this->actingAs($user, 'sanctum')->postJson("/api/breeding-cycles/{$cycle['id']}/pregnancy-check", [
            'result' => 'pregnant',
            'checked_on' => now()->subDays(5)->toDateString(),
        ])->assertStatus(200);

        $this->assertSame('pregnant', $dam->fresh()->breeding_status);

        $birth = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'breeding_cycle_id' => $cycle['id'],
            'sire_id' => $sire->id,
            'born_on' => now()->toDateString(),
            'offspring_total' => 1,
            'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb 1', 'sex' => 'female']],
        ])->json();

        $this->assertSame('nursing', $dam->fresh()->breeding_status);

        $this->actingAs($user, 'sanctum')->postJson("/api/breeding-cycles/{$cycle['id']}/wean", [
            'weaned_on' => now()->toDateString(),
        ])->assertStatus(200);

        $this->assertSame('available', $dam->fresh()->breeding_status);

        // Starting a fresh cycle is allowed again now that the previous one is closed.
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/breeding-cycles", [
            'method' => 'ai',
            'bred_on' => now()->toDateString(),
        ])->assertStatus(201);
    }

    public function test_pregnancy_check_not_pregnant_returns_dam_to_available()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);

        $cycle = BreedingCycle::create([
            'animal_id' => $dam->id,
            'method' => 'natural',
            'bred_on' => now()->subDays(50),
        ]);

        $this->actingAs($user, 'sanctum')->postJson("/api/breeding-cycles/{$cycle->id}/pregnancy-check", [
            'result' => 'not_pregnant',
            'checked_on' => now()->toDateString(),
        ])->assertStatus(200);

        $this->assertSame('available', $dam->fresh()->breeding_status);
    }

    public function test_pregnancy_check_date_cannot_precede_breeding_date()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $cycle = BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/breeding-cycles/{$cycle->id}/pregnancy-check", [
            'result' => 'pregnant',
            'checked_on' => now()->subDays(5)->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('checked_on');
    }

    public function test_expected_dates_use_the_dams_species_rules()
    {
        [$user, $farm] = $this->farmOwner();
        $cow = $this->dam($farm, ['type' => 'cow', 'name' => 'Bessie']);

        $cycle = BreedingCycle::create([
            'animal_id' => $cow->id,
            'method' => 'natural',
            'bred_on' => now()->subDays(10),
            'pregnancy_result' => 'pregnant',
        ]);

        $this->assertEquals(
            BreedingCycle::SPECIES_RULES['cow']['gestation_days'],
            $cycle->bred_on->diffInDays($cycle->expected_lambing_on)
        );
    }

    public function test_cannot_wean_a_cycle_with_no_recorded_birth()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $cycle = BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/breeding-cycles/{$cycle->id}/wean", [
            'weaned_on' => now()->toDateString(),
        ]);

        $response->assertStatus(400);
    }

    public function test_cycle_can_be_edited_and_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $cycle = BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()->subDays(5)]);

        $this->actingAs($user, 'sanctum')->putJson("/api/breeding-cycles/{$cycle->id}", [
            'method' => 'ai',
            'bred_on' => now()->subDays(6)->toDateString(),
        ])->assertStatus(200)->assertJson(['method' => 'ai']);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/breeding-cycles/{$cycle->id}")->assertStatus(200);
        $this->assertDatabaseMissing('breeding_cycles', ['id' => $cycle->id]);
    }

    public function test_another_farm_cannot_access_this_farms_cycles()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $dam = $this->dam($farm);
        $cycle = BreedingCycle::create(['animal_id' => $dam->id, 'method' => 'natural', 'bred_on' => now()]);

        $this->actingAs($intruder, 'sanctum')->getJson("/api/animals/{$dam->id}/breeding-cycles")->assertStatus(404);
        $this->actingAs($intruder, 'sanctum')->deleteJson("/api/breeding-cycles/{$cycle->id}")->assertStatus(404);
    }
}
