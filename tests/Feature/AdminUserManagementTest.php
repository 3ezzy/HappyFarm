<?php

namespace Tests\Feature;

use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
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
    // Suspend / reactivate
    // ------------------------------------------------------------

    public function test_suspending_an_approved_user_requires_approved_status()
    {
        $admin = $this->admin();
        $pending = User::factory()->create(['status' => 'pending']);
        $rejected = User::factory()->create(['status' => 'rejected']);
        $alreadySuspended = User::factory()->create(['status' => 'suspended']);

        foreach ([$pending, $rejected, $alreadySuspended] as $target) {
            $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$target->id}/suspend")
                ->assertStatus(400)->assertJson(['error' => 'Only approved users can be suspended.']);
        }
    }

    public function test_reactivating_requires_suspended_status()
    {
        $admin = $this->admin();
        $approved = User::factory()->create(['status' => 'approved']);

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$approved->id}/reactivate")
            ->assertStatus(400)->assertJson(['error' => 'Only suspended users can be reactivated.']);
    }

    /**
     * The critical guarantee: suspension must remove access from an
     * already-issued token immediately, not just block the next login.
     */
    public function test_suspending_a_user_immediately_revokes_their_existing_token()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'approved', 'password' => bcrypt('password')]);
        Farm::create(['user_id' => $user->id, 'name' => 'Farm']);

        $login = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password']);
        $login->assertStatus(200);
        $token = $login->json('token');

        // The token works before suspension.
        $this->withToken($token)->getJson('/api/animals')->assertStatus(200);

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$user->id}/suspend")
            ->assertStatus(200)->assertJson(['status' => 'suspended']);

        // Auth::forgetGuards(): Laravel's test harness caches the guard's
        // resolved user across multiple simulated requests within one test
        // method — without this, the second call below would reuse the
        // first call's already-resolved user instead of re-checking the
        // (now-deleted) token against the database. Real HTTP requests in
        // production don't share this cache; each is independently
        // resolved, so this is purely a test-isolation detail, not a
        // production behavior being worked around.
        Auth::forgetGuards();

        // The exact same token no longer works — not a new login attempt,
        // the same previously-valid session.
        $this->withToken($token)->getJson('/api/animals')->assertStatus(401);
    }

    public function test_suspended_user_cannot_login()
    {
        $user = User::factory()->create(['status' => 'suspended', 'password' => bcrypt('password')]);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertStatus(400)->assertJson(['error' => 'Your account has been suspended.']);
    }

    /**
     * Unlike pending/rejected, admins do NOT bypass the suspended gate —
     * there's no bootstrap scenario that needs it, since another admin
     * did the suspending and can reactivate them.
     */
    public function test_suspended_admin_does_not_bypass_the_login_gate()
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'suspended', 'password' => bcrypt('password')]);

        $this->postJson('/api/login', ['email' => $admin->email, 'password' => 'password'])
            ->assertStatus(400)->assertJson(['error' => 'Your account has been suspended.']);
    }

    public function test_reactivated_user_can_login_again()
    {
        $admin = $this->admin();
        $user = User::factory()->create(['status' => 'suspended', 'password' => bcrypt('password')]);
        Farm::create(['user_id' => $user->id, 'name' => 'Farm']);

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$user->id}/reactivate")
            ->assertStatus(200)->assertJson(['status' => 'approved']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])
            ->assertStatus(200)->assertJsonStructure(['token']);
    }

    /**
     * Backend guard: an admin must not be able to lock themselves out,
     * even if they bypass or ignore the frontend's hidden button.
     */
    public function test_admin_cannot_suspend_their_own_account()
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$admin->id}/suspend")
            ->assertStatus(400)->assertJson(['error' => 'You cannot suspend your own account.']);

        $this->assertDatabaseHas('users', ['id' => $admin->id, 'status' => 'approved']);
    }

    public function test_admin_can_suspend_another_admins_account()
    {
        $admin = $this->admin();
        $otherAdmin = $this->admin();

        $this->actingAs($admin, 'sanctum')->postJson("/api/admin/users/{$otherAdmin->id}/suspend")
            ->assertStatus(200)->assertJson(['status' => 'suspended']);
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

    public function test_normal_user_cannot_suspend_or_reactivate()
    {
        $user = User::factory()->create(['role' => 'user']);
        $approvedTarget = User::factory()->create(['status' => 'approved']);
        $suspendedTarget = User::factory()->create(['status' => 'suspended']);

        $this->actingAs($user, 'sanctum')->postJson("/api/admin/users/{$approvedTarget->id}/suspend")->assertStatus(403);
        $this->actingAs($user, 'sanctum')->postJson("/api/admin/users/{$suspendedTarget->id}/reactivate")->assertStatus(403);

        $this->assertDatabaseHas('users', ['id' => $approvedTarget->id, 'status' => 'approved']);
        $this->assertDatabaseHas('users', ['id' => $suspendedTarget->id, 'status' => 'suspended']);
    }

    public function test_unauthenticated_request_cannot_access_admin_endpoints()
    {
        $this->getJson('/api/admin/users')->assertStatus(401);
    }
}
