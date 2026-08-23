<?php

namespace Tests\Feature;

use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 4 Step 3: the admin-only user management API — list/filter,
 * approve/reject (pending-only), and the authorization boundary.
 */
class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    // ------------------------------------------------------------
    // Listing / filtering
    // ------------------------------------------------------------

    public function test_admin_can_list_all_users_across_farms()
    {
        $admin = $this->admin();
        $userA = User::factory()->create(['status' => 'pending']);
        Farm::create(['user_id' => $userA->id, 'name' => "A's Farm"]);
        $userB = User::factory()->create(['status' => 'approved']);
        Farm::create(['user_id' => $userB->id, 'name' => "B's Farm"]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users');

        $response->assertStatus(200);
        $ids = collect($response->json())->pluck('id');
        $this->assertTrue($ids->contains($admin->id));
        $this->assertTrue($ids->contains($userA->id));
        $this->assertTrue($ids->contains($userB->id));
    }

    public function test_admin_can_filter_users_by_status()
    {
        $admin = $this->admin();
        $pending = User::factory()->create(['status' => 'pending']);
        $approved = User::factory()->create(['status' => 'approved']);
        $rejected = User::factory()->create(['status' => 'rejected']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users?status=pending');

        $response->assertStatus(200);
        $ids = collect($response->json())->pluck('id');
        $this->assertTrue($ids->contains($pending->id));
        $this->assertFalse($ids->contains($approved->id));
        $this->assertFalse($ids->contains($rejected->id));
    }

    public function test_admin_user_list_includes_farm_name_and_hides_password()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'pending']);
        Farm::create(['user_id' => $user->id, 'name' => 'Sunny Acres']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users?status=pending');

        $response->assertStatus(200);
        $row = collect($response->json())->firstWhere('id', $user->id);
        $this->assertSame('Sunny Acres', $row['farm_name']);
        $this->assertArrayNotHasKey('password', $row);
    }

    /**
     * Regression: created_at must be date-only ("YYYY-MM-DD"), matching
     * every other date field in this API. A full ISO timestamp here
     * previously made the frontend's fmtDate() throw on render (it splits
     * on "-" expecting exactly a date), which blanked the entire Admin
     * page — this app has no error boundary, so an uncaught render error
     * anywhere unmounts everything, not just the offending row.
     */
    public function test_admin_user_list_created_at_is_date_only()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'pending']);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users?status=pending');

        $row = collect($response->json())->firstWhere('id', $user->id);
        $this->assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}$/', $row['created_at']);
    }

    // ------------------------------------------------------------
    // Approve / reject
    // ------------------------------------------------------------

    public function test_admin_can_approve_a_pending_user_and_they_can_then_login()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'pending', 'password' => bcrypt('password')]);
        Farm::create(['user_id' => $user->id, 'name' => 'Farm']);

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$user->id}/approve")
            ->assertStatus(200)->assertJson(['status' => 'approved']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertStatus(200)->assertJsonStructure(['token']);
    }

    public function test_admin_can_reject_a_pending_user_and_they_still_cannot_login()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'pending', 'password' => bcrypt('password')]);
        Farm::create(['user_id' => $user->id, 'name' => 'Farm']);

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$user->id}/reject")
            ->assertStatus(200)->assertJson(['status' => 'rejected']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertStatus(400)->assertJson(['error' => 'Your account has been rejected.']);
    }

    public function test_approving_an_already_approved_user_is_rejected()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'approved']);

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$user->id}/approve")
            ->assertStatus(400)->assertJson(['error' => 'Only pending users can be approved.']);
    }

    public function test_rejecting_an_already_rejected_user_is_rejected()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'rejected']);

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$user->id}/reject")
            ->assertStatus(400)->assertJson(['error' => 'Only pending users can be rejected.']);
    }

    /**
     * "No approval revocation" — rejecting an already-approved user must
     * be impossible through this API, not just discouraged by the UI.
     */
    public function test_rejecting_an_approved_user_is_rejected()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'approved']);

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$user->id}/reject")
            ->assertStatus(400)->assertJson(['error' => 'Only pending users can be rejected.']);
    }

    public function test_admins_own_session_remains_valid_after_approving_a_user()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'pending']);

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$user->id}/approve")->assertStatus(200);

        $this->actingAs($admin, 'sanctum')->getJson('/api/admin/users')->assertStatus(200);
    }

    // ------------------------------------------------------------
    // Authorization boundary
    // ------------------------------------------------------------

    public function test_normal_user_cannot_list_users()
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user, 'sanctum')->getJson('/api/admin/users')->assertStatus(403);
    }

    public function test_normal_user_cannot_approve_or_reject()
    {
        $user = User::factory()->create(['role' => 'user']);
        $target = User::factory()->create(['status' => 'pending']);

        $this->actingAs($user, 'sanctum')->postJson("/api/admin/users/{$target->id}/approve")->assertStatus(403);
        $this->actingAs($user, 'sanctum')->postJson("/api/admin/users/{$target->id}/reject")->assertStatus(403);

        $this->assertDatabaseHas('users', ['id' => $target->id, 'status' => 'pending']);
    }

    public function test_unauthenticated_request_cannot_access_admin_endpoints()
    {
        $this->getJson('/api/admin/users')->assertStatus(401);
    }
}
