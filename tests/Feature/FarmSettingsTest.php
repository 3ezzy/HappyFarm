<?php

namespace Tests\Feature;

use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FarmSettingsTest extends TestCase
{
    use RefreshDatabase;

    private function farmOwner(string $password = 'password123'): array
    {
        $user = User::factory()->create(['password' => bcrypt($password)]);
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        return [$user, $farm];
    }

    // ------------------------------------------------------------
    // Farm rename
    // ------------------------------------------------------------

    public function test_farm_name_can_be_updated()
    {
        [$user] = $this->farmOwner();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/farm', ['name' => 'New Farm Name']);

        $response->assertStatus(200)->assertJson(['name' => 'New Farm Name']);
        $this->assertDatabaseHas('farms', ['user_id' => $user->id, 'name' => 'New Farm Name']);
    }

    public function test_farm_name_rejects_blank_value()
    {
        [$user] = $this->farmOwner();

        $this->actingAs($user, 'sanctum')->putJson('/api/farm', ['name' => ''])
            ->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_farm_update_always_targets_the_authenticated_users_own_farm()
    {
        [$owner] = $this->farmOwner();
        [$intruder, $intruderFarm] = $this->farmOwner();

        $this->actingAs($intruder, 'sanctum')->putJson('/api/farm', ['name' => 'Hijacked'])
            ->assertStatus(200)->assertJson(['id' => $intruderFarm->id]);

        // The intruder can only ever rename their own farm — there's no
        // farm id in the route to target someone else's.
        $this->assertDatabaseMissing('farms', ['user_id' => $owner->id, 'name' => 'Hijacked']);
    }

    // ------------------------------------------------------------
    // Password change
    // ------------------------------------------------------------

    public function test_password_can_be_changed_with_correct_current_password()
    {
        [$user] = $this->farmOwner('password123');

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/user/password', [
            'current_password' => 'password123',
            'password' => 'newpassword456',
            'password_confirmation' => 'newpassword456',
        ]);

        $response->assertStatus(200);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('newpassword456', $user->fresh()->password));
    }

    public function test_password_change_is_rejected_with_wrong_current_password()
    {
        [$user] = $this->farmOwner('password123');

        $this->actingAs($user, 'sanctum')->putJson('/api/user/password', [
            'current_password' => 'wrongpassword',
            'password' => 'newpassword456',
            'password_confirmation' => 'newpassword456',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password123', $user->fresh()->password));
    }

    public function test_password_change_rejects_a_short_new_password()
    {
        [$user] = $this->farmOwner('password123');

        $this->actingAs($user, 'sanctum')->putJson('/api/user/password', [
            'current_password' => 'password123',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_password_change_rejects_a_mismatched_confirmation()
    {
        [$user] = $this->farmOwner('password123');

        $this->actingAs($user, 'sanctum')->putJson('/api/user/password', [
            'current_password' => 'password123',
            'password' => 'newpassword456',
            'password_confirmation' => 'somethingelse',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_password_change_rejects_reusing_the_current_password()
    {
        [$user] = $this->farmOwner('password123');

        $this->actingAs($user, 'sanctum')->putJson('/api/user/password', [
            'current_password' => 'password123',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422)->assertJsonValidationErrors('password');
    }

    /**
     * Regression for decision 5: no forced logout on other devices.
     * The token used to make the password-change request itself must
     * keep working immediately afterward.
     */
    public function test_existing_token_still_works_after_a_password_change()
    {
        [$user] = $this->farmOwner('password123');

        $this->actingAs($user, 'sanctum')->putJson('/api/user/password', [
            'current_password' => 'password123',
            'password' => 'newpassword456',
            'password_confirmation' => 'newpassword456',
        ])->assertStatus(200);

        $this->actingAs($user, 'sanctum')->getJson('/api/farm')->assertStatus(200);
    }
}
