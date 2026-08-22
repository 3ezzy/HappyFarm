<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

/**
 * Phase 4 Step 2: registration approval status, roles, login gating, and
 * the user:make-admin bootstrap command.
 */
class AuthApprovalTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------
    // Defaults
    // ------------------------------------------------------------

    public function test_a_new_user_defaults_to_approved_and_role_user()
    {
        // Confirms the column defaults (approved/user) — the real-world
        // equivalent of "existing users are backfilled as approved" on a
        // fresh test DB, which can't observe an actual pre-migration state.
        // refresh(): same reasoning as AnimalController::store() — the
        // in-memory model after create() doesn't reflect DB-level column
        // defaults that were never explicitly assigned.
        $user = User::factory()->create()->refresh();

        $this->assertSame('approved', $user->status);
        $this->assertSame('user', $user->role);
    }

    // ------------------------------------------------------------
    // Login gating
    // ------------------------------------------------------------

    public function test_pending_user_cannot_login()
    {
        $user = User::factory()->create(['status' => 'pending', 'password' => bcrypt('password')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email, 'password' => 'password',
        ]);

        $response->assertStatus(400)->assertJson(['error' => 'Your account is awaiting administrator approval.']);
    }

    public function test_rejected_user_cannot_login()
    {
        $user = User::factory()->create(['status' => 'rejected', 'password' => bcrypt('password')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email, 'password' => 'password',
        ]);

        $response->assertStatus(400)->assertJson(['error' => 'Your account has been rejected.']);
    }

    public function test_approved_user_logs_in_normally()
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);
        \App\Models\Farm::create(['user_id' => $user->id, 'name' => 'Farm']);

        $response = $this->postJson('/api/login', [
            'email' => $user->email, 'password' => 'password',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['user' => ['id', 'name', 'email', 'role'], 'farm', 'token']);
    }

    /**
     * A wrong password on a pending/rejected account must still return the
     * generic bad-credentials error, not a status-specific one — otherwise
     * the login endpoint would leak account status to anyone who merely
     * knows the email, without needing the real password.
     */
    public function test_wrong_password_on_a_pending_account_returns_generic_credentials_error()
    {
        $user = User::factory()->create(['status' => 'pending', 'password' => bcrypt('password')]);

        $response = $this->postJson('/api/login', [
            'email' => $user->email, 'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
        $this->assertStringContainsString(
            'incorrect',
            $response->json('errors.email.0')
        );
    }

    /**
     * The user:make-admin command deliberately leaves status untouched —
     * so the very first admin, promoted while still 'pending', must be
     * able to log in anyway to approve accounts (including their own).
     */
    public function test_admin_bypasses_the_pending_login_gate()
    {
        $user = User::factory()->create(['status' => 'pending', 'role' => 'admin', 'password' => bcrypt('password')]);
        \App\Models\Farm::create(['user_id' => $user->id, 'name' => 'Farm']);

        $response = $this->postJson('/api/login', [
            'email' => $user->email, 'password' => 'password',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['token']);
    }

    public function test_admin_bypasses_the_rejected_login_gate()
    {
        $user = User::factory()->create(['status' => 'rejected', 'role' => 'admin', 'password' => bcrypt('password')]);
        \App\Models\Farm::create(['user_id' => $user->id, 'name' => 'Farm']);

        $response = $this->postJson('/api/login', [
            'email' => $user->email, 'password' => 'password',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['token']);
    }

    // ------------------------------------------------------------
    // user:make-admin command
    // ------------------------------------------------------------

    public function test_make_admin_command_promotes_the_intended_user()
    {
        $user = User::factory()->create(['status' => 'pending']);

        $exitCode = Artisan::call('user:make-admin', ['email' => $user->email]);

        $this->assertSame(0, $exitCode);
        $user->refresh();
        $this->assertSame('admin', $user->role);
        // status is deliberately untouched by this command.
        $this->assertSame('pending', $user->status);
    }

    public function test_make_admin_command_reports_a_clear_error_for_an_unknown_email()
    {
        $exitCode = Artisan::call('user:make-admin', ['email' => 'nobody@example.com']);

        $this->assertSame(1, $exitCode);
        $this->assertStringContainsString('No user found', Artisan::output());
    }

    public function test_make_admin_command_is_idempotent_for_an_existing_admin()
    {
        $user = User::factory()->create(['role' => 'admin']);

        $exitCode = Artisan::call('user:make-admin', ['email' => $user->email]);

        $this->assertSame(0, $exitCode);
        $this->assertStringContainsString('already an admin', Artisan::output());
    }
}
