<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Breed;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnimalProfileTest extends TestCase
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

    public function test_animal_can_be_created_with_full_profile_fields()
    {
        [$user, $farm] = $this->farmOwner();
        $breed = Breed::create(['species' => 'sheep', 'name' => 'Sardi']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep',
            'name' => 'Nour',
            'tag' => 'S-001',
            'breed_id' => $breed->id,
            'sex' => 'female',
            'date_of_birth' => now()->subYears(2)->toDateString(),
            'date_of_purchase' => now()->subMonths(6)->toDateString(),
            'origin' => 'purchased',
        ]);

        $response->assertStatus(201)->assertJson([
            'tag' => 'S-001',
            'breed_id' => $breed->id,
            'breed' => 'Sardi',
            'sex' => 'female',
            'origin' => 'purchased',
            'is_eligible' => true,
            'min_age_text' => '6 months',
        ]);

        $this->assertDatabaseHas('animals', [
            'farm_id' => $farm->id,
            'tag' => 'S-001',
            'breed_id' => $breed->id,
        ]);
    }

    public function test_age_only_payload_still_works_and_computes_date_of_birth()
    {
        [$user] = $this->farmOwner();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'goat',
            'name' => 'Legacy',
            'age' => 1.5,
        ]);

        $response->assertStatus(201)->assertJson(['age' => 1.5]);
        $response->assertJsonPath('date_of_birth', fn ($dob) => $dob !== null);
    }

    public function test_neither_age_nor_date_of_birth_is_rejected()
    {
        [$user] = $this->farmOwner();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep',
            'name' => 'No Age',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('age');
    }

    public function test_tag_must_be_unique_within_a_farm_but_not_across_farms()
    {
        [$user1] = $this->farmOwner();
        [$user2] = $this->farmOwner();

        $this->actingAs($user1, 'sanctum')
            ->postJson('/api/animals', ['type' => 'sheep', 'name' => 'A', 'tag' => 'DUP', 'age' => 1])
            ->assertStatus(201);

        // Same tag, same farm -> rejected
        $this->actingAs($user1, 'sanctum')
            ->postJson('/api/animals', ['type' => 'sheep', 'name' => 'B', 'tag' => 'DUP', 'age' => 1])
            ->assertStatus(422)
            ->assertJsonValidationErrors('tag');

        // Same tag, different farm -> allowed
        $this->actingAs($user2, 'sanctum')
            ->postJson('/api/animals', ['type' => 'sheep', 'name' => 'C', 'tag' => 'DUP', 'age' => 1])
            ->assertStatus(201);
    }

    public function test_search_matches_partial_tag_and_name()
    {
        [$user] = $this->farmOwner();
        $this->actingAs($user, 'sanctum')->postJson('/api/animals', ['type' => 'sheep', 'name' => 'Nour', 'tag' => 'S-001', 'age' => 1]);
        $this->actingAs($user, 'sanctum')->postJson('/api/animals', ['type' => 'goat', 'name' => 'Billy', 'tag' => 'G-014', 'age' => 1]);

        $byTag = $this->actingAs($user, 'sanctum')->getJson('/api/animals?search=s-00');
        $byTag->assertStatus(200)->assertJsonCount(1)->assertJsonPath('0.name', 'Nour');

        $byName = $this->actingAs($user, 'sanctum')->getJson('/api/animals?search=bil');
        $byName->assertStatus(200)->assertJsonCount(1)->assertJsonPath('0.name', 'Billy');
    }

    public function test_dam_and_sire_must_belong_to_the_same_farm()
    {
        [$user1, $farm1] = $this->farmOwner();
        [$user2] = $this->farmOwner();

        $otherFarmsAnimal = Animal::create([
            'farm_id' => (Farm::create(['user_id' => $user2->id, 'name' => 'Other']))->id,
            'type' => 'sheep',
            'name' => 'Not Mine',
            'age' => 3,
        ]);

        $response = $this->actingAs($user1, 'sanctum')->postJson('/api/animals', [
            'type' => 'sheep',
            'name' => 'Lamb',
            'age' => 0.1,
            'dam_id' => $otherFarmsAnimal->id,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('dam_id');
    }

    public function test_sacrifice_sets_exit_date_and_exit_reason()
    {
        [$user] = $this->farmOwner();
        $animal = $this->actingAs($user, 'sanctum')
            ->postJson('/api/animals', ['type' => 'sheep', 'name' => 'Adult', 'age' => 1])
            ->json();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal['id']}/sacrifice");

        $response->assertStatus(200)->assertJson(['exit_reason' => 'sacrifice']);
        $response->assertJsonPath('exit_date', fn ($date) => $date === now()->toDateString());

        $this->assertDatabaseHas('animals', [
            'id' => $animal['id'],
            'exit_reason' => 'sacrifice',
        ]);
    }

    public function test_weight_history_can_be_recorded_and_listed_newest_first()
    {
        [$user] = $this->farmOwner();
        $animal = $this->actingAs($user, 'sanctum')
            ->postJson('/api/animals', ['type' => 'sheep', 'name' => 'Woolly', 'age' => 1])
            ->json();

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal['id']}/weights", [
            'weight_kg' => 40,
            'measured_at' => now()->subDays(10)->toDateString(),
        ])->assertStatus(201);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal['id']}/weights", [
            'weight_kg' => 42.5,
            'measured_at' => now()->subDays(1)->toDateString(),
        ])->assertStatus(201);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal['id']}/weights");

        $response->assertStatus(200)->assertJsonCount(2);
        $response->assertJsonPath('0.weight_kg', 42.5);
    }

    public function test_weights_are_scoped_to_the_owning_farm()
    {
        [$user1] = $this->farmOwner();
        [$user2] = $this->farmOwner();

        $animal = $this->actingAs($user1, 'sanctum')
            ->postJson('/api/animals', ['type' => 'sheep', 'name' => 'Mine', 'age' => 1])
            ->json();

        $this->actingAs($user2, 'sanctum')
            ->getJson("/api/animals/{$animal['id']}/weights")
            ->assertStatus(404);

        $this->actingAs($user2, 'sanctum')
            ->postJson("/api/animals/{$animal['id']}/weights", ['weight_kg' => 10, 'measured_at' => now()->toDateString()])
            ->assertStatus(404);
    }

    public function test_breeds_can_be_listed_and_filtered_by_species()
    {
        [$user] = $this->farmOwner();
        Breed::create(['species' => 'sheep', 'name' => 'Sardi']);
        Breed::create(['species' => 'sheep', 'name' => "D'man"]);
        Breed::create(['species' => 'goat', 'name' => 'Boer']);

        $all = $this->actingAs($user, 'sanctum')->getJson('/api/breeds');
        $all->assertStatus(200)->assertJsonCount(3);

        $sheepOnly = $this->actingAs($user, 'sanctum')->getJson('/api/breeds?species=sheep');
        $sheepOnly->assertStatus(200)->assertJsonCount(2);
    }
}
