<?php

namespace Tests\Feature;

use App\Models\Animal;
use App\Models\Farm;
use App\Models\HealthRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthRecordTest extends TestCase
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

    private function animal(Farm $farm): Animal
    {
        return Animal::create(['farm_id' => $farm->id, 'type' => 'sheep', 'name' => 'Nour', 'age' => 2]);
    }

    public function test_record_is_created_and_listed()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/health-records", [
            'kind' => 'vaccine',
            'product' => 'Clostridial',
            'administered_on' => now()->toDateString(),
            'next_due_on' => now()->addMonths(6)->toDateString(),
        ])->assertStatus(201)->assertJson(['kind' => 'vaccine', 'product' => 'Clostridial']);

        $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal->id}/health-records")
            ->assertStatus(200)->assertJsonCount(1);
    }

    public function test_invalid_kind_is_rejected()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/health-records", [
            'kind' => 'bogus',
            'administered_on' => now()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('kind');
    }

    public function test_administered_on_cannot_be_in_the_future()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/health-records", [
            'kind' => 'vitamin',
            'administered_on' => now()->addDay()->toDateString(),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('administered_on');
    }

    public function test_active_withdrawal_surfaces_on_the_animal_and_expires_correctly()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);

        // An expired withdrawal must not surface at all.
        HealthRecord::create([
            'animal_id' => $animal->id,
            'kind' => 'antibiotic',
            'administered_on' => now()->subDays(30),
            'withdrawal_until' => now()->subDay(),
        ]);
        $this->assertNull($animal->fresh()->active_withdrawal);

        // An active one must surface with the right data.
        $active = HealthRecord::create([
            'animal_id' => $animal->id,
            'kind' => 'antibiotic',
            'product' => 'Oxytetracycline',
            'administered_on' => now(),
            'withdrawal_until' => now()->addDays(7),
        ]);

        $withdrawal = $animal->fresh()->active_withdrawal;
        $this->assertSame($active->id, $withdrawal->id);

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/animals/{$animal->id}");
        $response->assertJson([
            'active_withdrawal' => [
                'health_record_id' => $active->id,
                'product' => 'Oxytetracycline',
                'withdrawal_until' => now()->addDays(7)->toDateString(),
            ],
        ]);
    }

    public function test_sacrifice_is_not_blocked_by_an_active_withdrawal()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm); // age 2, eligible

        HealthRecord::create([
            'animal_id' => $animal->id,
            'kind' => 'antibiotic',
            'administered_on' => now(),
            'withdrawal_until' => now()->addDays(7),
        ]);

        // Warn-but-allow, not a hard block — the sacrifice endpoint's
        // behavior is unchanged by an active withdrawal. The frontend is
        // responsible for warning the user before this request is sent.
        $this->actingAs($user, 'sanctum')->postJson("/api/animals/{$animal->id}/sacrifice")
            ->assertStatus(200)
            ->assertJson(['is_sacrificed' => true]);
    }

    public function test_record_can_be_edited_and_deleted()
    {
        [$user, $farm] = $this->farmOwner();
        $animal = $this->animal($farm);
        $record = HealthRecord::create([
            'animal_id' => $animal->id,
            'kind' => 'vitamin',
            'administered_on' => now(),
        ]);

        $this->actingAs($user, 'sanctum')->putJson("/api/health-records/{$record->id}", [
            'kind' => 'vitamin',
            'administered_on' => now()->toDateString(),
            'notes' => 'corrected',
        ])->assertStatus(200)->assertJson(['notes' => 'corrected']);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/health-records/{$record->id}")->assertStatus(200);
        $this->assertDatabaseMissing('health_records', ['id' => $record->id]);
    }

    public function test_another_farm_cannot_access_this_farms_health_records()
    {
        [$owner, $farm] = $this->farmOwner();
        [$intruder] = $this->farmOwner();
        $animal = $this->animal($farm);
        $record = HealthRecord::create(['animal_id' => $animal->id, 'kind' => 'vaccine', 'administered_on' => now()]);

        $this->actingAs($intruder, 'sanctum')->getJson("/api/animals/{$animal->id}/health-records")->assertStatus(404);
        $this->actingAs($intruder, 'sanctum')->deleteJson("/api/health-records/{$record->id}")->assertStatus(404);
    }
}
