<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Farm;
use App\Models\Animal;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'user' => ['id', 'name', 'email'],
                    'farm' => ['id', 'name'],
                    'token'
                ]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com'
        ]);

        $this->assertDatabaseHas('farms', [
            'name' => 'Test User\'s Farm'
        ]);
    }

    public function test_user_can_login()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'user' => ['id', 'name', 'email'],
                    'farm' => ['id', 'name'],
                    'token'
                ]);
    }

    public function test_authenticated_user_can_add_animal()
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        $response = $this->actingAs($user, 'sanctum')
                        ->postJson('/api/animals', [
                            'type' => 'sheep',
                            'name' => 'Test Sheep',
                            'age' => 1.0,
                        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'id', 'type', 'name', 'age', 
                    'fed_at', 'groomed_at', 'sacrificed_at', 'is_sacrificed'
                ]);

        $this->assertDatabaseHas('animals', [
            'farm_id' => $farm->id,
            'type' => 'sheep',
            'name' => 'Test Sheep',
        ]);
    }

    public function test_sacrifice_eligibility_validation()
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        // Create a young sheep (4 months old - not eligible)
        $animal = Animal::create([
            'farm_id' => $farm->id,
            'type' => 'sheep',
            'name' => 'Young Sheep',
            'age' => 0.33 // 4 months
        ]);

        $response = $this->actingAs($user, 'sanctum')
                        ->postJson("/api/animals/{$animal->id}/sacrifice");

        $response->assertStatus(400)
                ->assertJson([
                    'error' => 'Sheep must be at least 6 months old for sacrifice.'
                ]);
    }

    public function test_eligible_animal_can_be_sacrificed()
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        // Create an eligible sheep (1 year old)
        $animal = Animal::create([
            'farm_id' => $farm->id,
            'type' => 'sheep',
            'name' => 'Adult Sheep',
            'age' => 1.0
        ]);

        $response = $this->actingAs($user, 'sanctum')
                        ->postJson("/api/animals/{$animal->id}/sacrifice");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'id', 'sacrificed_at', 'is_sacrificed'
                ]);

        $this->assertDatabaseHas('animals', [
            'id' => $animal->id,
            'is_sacrificed' => true,
        ]);
    }

    public function test_user_can_feed_animal()
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        $animal = Animal::create([
            'farm_id' => $farm->id,
            'type' => 'cow',
            'name' => 'Test Cow',
            'age' => 3.0
        ]);

        $response = $this->actingAs($user, 'sanctum')
                        ->postJson("/api/animals/{$animal->id}/feed");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'id', 'fed_at'
                ]);

        $animal->refresh();
        $this->assertNotNull($animal->fed_at);
    }

    public function test_unauthenticated_user_cannot_access_animals()
    {
        $response = $this->getJson('/api/animals');
        $response->assertStatus(401);
    }
} 