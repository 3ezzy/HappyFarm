<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Birth;
use App\Models\BreedingCycle;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BirthTest extends TestCase
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

    private function dam(Farm $farm): Animal
    {
        return Animal::create([
            'farm_id' => $farm->id,
            'type' => 'sheep',
            'name' => 'Nour',
            'sex' => 'female',
            'age' => 3,
        ]);
    }

    public function test_recording_a_birth_creates_exactly_offspring_alive_animals()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 3,
            'offspring_alive' => 2,
            'difficulty' => 'assisted',
            'offspring' => [
                ['name' => 'Lamb 1', 'sex' => 'female', 'tag' => 'L-001', 'birth_weight_kg' => 3.2],
                ['name' => 'Lamb 2', 'sex' => 'male'],
            ],
        ]);

        $response->assertStatus(201);
        $birthId = $response->json('id');

        $this->assertCount(2, $response->json('animals'));
        $this->assertDatabaseCount('animals', 3); // dam + 2 live lambs, never 3 (the stillborn isn't an animal)

        $lamb = Animal::where('tag', 'L-001')->first();
        $this->assertNotNull($lamb);
        $this->assertSame($dam->id, $lamb->dam_id);
        $this->assertSame($birthId, $lamb->birth_id);
        $this->assertSame('born', $lamb->origin);
        $this->assertSame(now()->toDateString(), $lamb->date_of_birth->toDateString());
        $this->assertSame('sheep', $lamb->type); // inherits the dam's species
    }

    public function test_birth_weight_is_recorded_as_the_lambs_first_weight_entry()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 1,
            'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb 1', 'sex' => 'female', 'birth_weight_kg' => 3.5]],
        ])->assertStatus(201);

        $lamb = Animal::where('name', 'Lamb 1')->first();

        $this->assertDatabaseHas('weights', [
            'animal_id' => $lamb->id,
            'weight_kg' => 3.5,
            'notes' => 'Birth weight',
        ]);
    }

    public function test_offspring_count_must_match_offspring_alive()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 2,
            'offspring_alive' => 2,
            'offspring' => [['name' => 'Only one', 'sex' => 'female']],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('offspring');
    }

    public function test_offspring_alive_cannot_exceed_offspring_total()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 1,
            'offspring_alive' => 2,
            'offspring' => [
                ['name' => 'A', 'sex' => 'female'],
                ['name' => 'B', 'sex' => 'male'],
            ],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('offspring_alive');
    }

    public function test_offspring_tags_must_be_unique_within_the_farm()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        Animal::create(['farm_id' => $farm->id, 'type' => 'sheep', 'name' => 'Existing', 'tag' => 'DUP', 'age' => 1]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 1,
            'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb', 'sex' => 'female', 'tag' => 'DUP']],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('offspring');
    }

    public function test_breeding_cycle_id_must_belong_to_this_dam()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);
        $otherDam = $this->dam($farm);
        $foreignCycle = \App\Models\BreedingCycle::create([
            'animal_id' => $otherDam->id,
            'method' => 'natural',
            'bred_on' => now()->subDays(50),
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'breeding_cycle_id' => $foreignCycle->id,
            'born_on' => now()->toDateString(),
            'offspring_total' => 1,
            'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb', 'sex' => 'female']],
        ]);

        $response->assertStatus(422);
    }

    public function test_deleting_a_birth_preserves_its_animals_and_their_history()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);

        $birth = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 1,
            'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb 1', 'sex' => 'female', 'birth_weight_kg' => 3.0]],
        ])->json();

        $lamb = Animal::where('name', 'Lamb 1')->first();
        $this->assertSame($birth['id'], $lamb->birth_id);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/births/{$birth['id']}")->assertStatus(200);

        $this->assertDatabaseMissing('births', ['id' => $birth['id']]);
        $this->assertDatabaseHas('animals', ['id' => $lamb->id, 'birth_id' => null]); // survives, just unlinked
        $this->assertDatabaseHas('weights', ['animal_id' => $lamb->id]); // its own history survives too
    }

    public function test_editing_a_birth_does_not_touch_its_animals()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = $this->dam($farm);

        $birth = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 2,
            'offspring_alive' => 1,
            'offspring' => [['name' => 'Lamb 1', 'sex' => 'female']],
        ])->json();

        $this->actingAs($user, 'sanctum')->putJson("/api/births/{$birth['id']}", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 1, // correcting a stillbirth-count typo
            'offspring_alive' => 1,
            'notes' => 'corrected count',
        ])->assertStatus(200)->assertJson(['offspring_total' => 1]);

        $this->assertDatabaseCount('animals', 2); // dam + the one lamb, unchanged
    }

    /**
     * Regression test for the bug reported after Phase 2 review: deleting a
     * birth's log entry used to make BreedingCycle::status fall back to
     * `pregnancy_result` (still 'pregnant', since recording a birth never
     * changes that column) and re-open lambing_due — even though the
     * animals it produced, correctly, were never touched. See the
     * `birthed_on` column and Birth::boot() for the fix.
     */
    public function test_deleting_a_birth_does_not_revert_the_cycle_to_pregnant_or_recreate_lambing_due()
    {
        [$user, $farm] = $this->farmOwner();
        $dam = Animal::create([
            'farm_id' => $farm->id,
            'type' => 'sheep',
            'name' => 'Nour',
            'sex' => 'female',
            'age' => 3,
        ]);

        // 1. Create a breeding cycle, already confirmed pregnant and well
        //    past the gestation window — an unresolved cycle here would
        //    generate an overdue lambing_due alert.
        $cycle = BreedingCycle::create([
            'animal_id' => $dam->id,
            'method' => 'natural',
            'bred_on' => now()->subDays(200),
            'pregnancy_result' => 'pregnant',
        ]);

        // 2. Record a birth with offspring through the real endpoint.
        $birth = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'breeding_cycle_id' => $cycle->id,
            'born_on' => now()->subDays(10)->toDateString(),
            'offspring_total' => 2,
            'offspring_alive' => 2,
            'offspring' => [
                ['name' => 'Lamb 1', 'sex' => 'female'],
                ['name' => 'Lamb 2', 'sex' => 'male'],
            ],
        ])->assertStatus(201)->json();

        $lambIds = collect($birth['animals'])->pluck('id')->all();
        $this->assertCount(2, $lambIds);

        // 3. The cycle is no longer "pregnant" and produces no lambing_due
        //    (or any other breeding) alert while the birth record exists.
        $cycle->refresh();
        $this->assertSame('lambed', $cycle->status);
        $this->assertNotNull($cycle->birthed_on);

        $dam->refresh();
        $this->assertSame('nursing', $dam->breeding_status);

        $alertsWithBirth = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $this->assertEmpty(array_filter($alertsWithBirth, fn ($a) => $a['animal_id'] === $dam->id));

        // 4. Delete the birth.
        $this->actingAs($user, 'sanctum')->deleteJson("/api/births/{$birth['id']}")->assertStatus(200);
        $this->assertDatabaseMissing('births', ['id' => $birth['id']]);

        // 5. Every offspring animal still exists.
        foreach ($lambIds as $id) {
            $this->assertDatabaseHas('animals', ['id' => $id]);
        }

        // 6. Their birth_id is now null, but nothing else about them changed.
        foreach ($lambIds as $id) {
            $this->assertDatabaseHas('animals', ['id' => $id, 'birth_id' => null, 'dam_id' => $dam->id]);
        }

        // 7. The cycle does NOT fall back to pregnant/open — birthed_on
        //    survives the birth's deletion, so status stays 'lambed' and
        //    the dam stays 'nursing', never reverting to 'pregnant'.
        $cycle->refresh();
        $this->assertSame('lambed', $cycle->status);
        $this->assertNotNull($cycle->birthed_on);
        $this->assertSame('pregnant', $cycle->pregnancy_result); // untouched, and no longer the source of truth

        $dam->refresh();
        $this->assertSame('nursing', $dam->breeding_status);

        // 8. No duplicate/stale alert (lambing_due or otherwise) is
        //    generated for this dam after the birth record is gone.
        $alertsAfterDelete = $this->actingAs($user, 'sanctum')->getJson('/api/alerts')->json();
        $this->assertEmpty(array_filter($alertsAfterDelete, fn ($a) => $a['animal_id'] === $dam->id));
    }

    public function test_another_farm_cannot_record_a_birth_for_this_farms_animal()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $dam = $this->dam($farm);

        $response = $this->actingAs($intruder, 'sanctum')->postJson("/api/animals/{$dam->id}/births", [
            'born_on' => now()->toDateString(),
            'offspring_total' => 1,
            'offspring_alive' => 1,
            'offspring' => [['name' => 'X', 'sex' => 'male']],
        ]);

        $response->assertStatus(404);
    }
}
