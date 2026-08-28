<?php

namespace Tests\Feature;

use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

/**
 * Forgot / Reset Password — built on Laravel's password broker
 * (password_reset_tokens table, already present from the base migration).
 */
class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    // ------------------------------------------------------------
    // Forgot password (request link)
    // ------------------------------------------------------------

    public function test_approved_user_can_request_a_password_reset_link()
    {
        $user = User::factory()->create(['status' => 'approved']);

        $response = $this->postJson('/api/forgot-password', ['email' => $user->email]);

        $response->assertStatus(200)->assertJson([
            'message' => 'If that email address is registered, a password reset link has been sent.',
        ]);

        $this->assertDatabaseHas('password_reset_tokens', ['email' => $user->email]);
    }

    /**
     * The response must not reveal whether the email is registered — same
     * status code, same message, and (naturally) no token row created.
     */
    public function test_unknown_email_returns_the_same_generic_message_and_creates_no_token()
    {
        $response = $this->postJson('/api/forgot-password', ['email' => 'nobody@example.com']);

        $response->assertStatus(200)->assertJson([
            'message' => 'If that email address is registered, a password reset link has been sent.',
        ]);

        $this->assertDatabaseCount('password_reset_tokens', 0);
    }

    /**
     * The broker's own throttle (config/auth.php: 60s) silently no-ops a
     * second request for the same email without regenerating the token —
     * the HTTP response still looks identical (see the test above), so
     * this asserts the effect at the repository level instead.
     */
    public function test_repeated_forgot_password_requests_do_not_regenerate_the_token_within_the_throttle_window()
    {
        $user = User::factory()->create(['status' => 'approved']);

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertStatus(200);
        $firstHash = DB::table('password_reset_tokens')->where('email', $user->email)->value('token');

        $this->postJson('/api/forgot-password', ['email' => $user->email])->assertStatus(200);
        $secondHash = DB::table('password_reset_tokens')->where('email', $user->email)->value('token');

        $this->assertSame($firstHash, $secondHash);
    }

    /**
     * Defense-in-depth on top of the broker's per-email throttle: the
     * route itself is limited to 6 requests/minute per IP.
     */
    public function test_forgot_password_route_is_rate_limited_per_ip()
    {
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/forgot-password', ['email' => "user{$i}@example.com"])
                ->assertStatus(200);
        }

        $this->postJson('/api/forgot-password', ['email' => 'user7@example.com'])
            ->assertStatus(429);
    }

    // ------------------------------------------------------------
    // Reset password (complete the flow)
    // ------------------------------------------------------------

    public function test_valid_token_resets_the_password()
    {
        $user = User::factory()->create(['status' => 'approved', 'password' => bcrypt('old-password')]);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200)->assertJson(['message' => 'Your password has been reset successfully.']);

        $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
    }

    public function test_invalid_token_is_rejected()
    {
        $user = User::factory()->create(['status' => 'approved', 'password' => bcrypt('old-password')]);

        $response = $this->postJson('/api/reset-password', [
            'token' => 'not-a-real-token',
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(400)->assertJson(['error' => 'This password reset link is invalid or has expired.']);
        $this->assertTrue(Hash::check('old-password', $user->refresh()->password));
    }

    public function test_expired_token_is_rejected()
    {
        $user = User::factory()->create(['status' => 'approved', 'password' => bcrypt('old-password')]);
        $token = Password::createToken($user);

        $this->travel(61)->minutes();

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(400)->assertJson(['error' => 'This password reset link is invalid or has expired.']);
        $this->assertTrue(Hash::check('old-password', $user->refresh()->password));
    }

    public function test_used_token_cannot_be_reused()
    {
        $user = User::factory()->create(['status' => 'approved', 'password' => bcrypt('old-password')]);
        $token = Password::createToken($user);

        $payload = [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ];

        $this->postJson('/api/reset-password', $payload)->assertStatus(200);

        $second = $this->postJson('/api/reset-password', array_merge($payload, [
            'password' => 'another-password',
            'password_confirmation' => 'another-password',
        ]));

        $second->assertStatus(400)->assertJson(['error' => 'This password reset link is invalid or has expired.']);
        $this->assertTrue(Hash::check('new-password', $user->refresh()->password));
    }

    public function test_password_confirmation_mismatch_is_rejected()
    {
        $user = User::factory()->create(['status' => 'approved']);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'does-not-match',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_old_password_no_longer_works_after_reset()
    {
        $user = User::factory()->create(['status' => 'approved', 'password' => bcrypt('old-password')]);
        Farm::create(['user_id' => $user->id, 'name' => 'Farm']);
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(200);

        $response = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'old-password']);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_new_password_works_after_reset()
    {
        $user = User::factory()->create(['status' => 'approved', 'password' => bcrypt('old-password')]);
        Farm::create(['user_id' => $user->id, 'name' => 'Farm']);
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(200);

        $response = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'new-password']);

        $response->assertStatus(200)->assertJsonStructure(['token']);
    }

    /**
     * Mirrors the live-token test from AdminUserManagementTest's suspend
     * coverage: mint a real Sanctum token via an actual login request, use
     * it once, reset the password, then confirm the same token is dead.
     * Auth::forgetGuards() is required between requests in this test
     * harness — see AdminUserManagementTest for the full explanation; it's
     * a test-isolation artifact (the guard caches the resolved user across
     * simulated requests in one test method), not production behavior.
     */
    public function test_resetting_a_password_immediately_revokes_existing_sanctum_tokens()
    {
        $user = User::factory()->create(['status' => 'approved', 'password' => bcrypt('old-password')]);
        Farm::create(['user_id' => $user->id, 'name' => 'Farm']);

        $login = $this->postJson('/api/login', ['email' => $user->email, 'password' => 'old-password']);
        $token = $login->json('token');

        $this->withToken($token)->getJson('/api/animals')->assertStatus(200);

        $resetToken = Password::createToken($user);
        $this->postJson('/api/reset-password', [
            'token' => $resetToken,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(200);

        Auth::forgetGuards();

        $this->withToken($token)->getJson('/api/animals')->assertStatus(401);
    }

    // ------------------------------------------------------------
    // Status / role are never touched by a reset
    // ------------------------------------------------------------

    public function test_pending_user_remains_pending_and_still_cannot_login_after_reset()
    {
        $user = User::factory()->create(['status' => 'pending', 'role' => 'user']);
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(200);

        $user->refresh();
        $this->assertSame('pending', $user->status);
        $this->assertSame('user', $user->role);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'new-password'])
            ->assertStatus(400)->assertJson(['error' => 'Your account is awaiting administrator approval.']);
    }

    public function test_rejected_user_remains_rejected_and_still_cannot_login_after_reset()
    {
        $user = User::factory()->create(['status' => 'rejected']);
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(200);

        $this->assertSame('rejected', $user->refresh()->status);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'new-password'])
            ->assertStatus(400)->assertJson(['error' => 'Your account has been rejected.']);
    }

    public function test_suspended_user_remains_suspended_and_still_cannot_login_after_reset()
    {
        $user = User::factory()->create(['status' => 'suspended']);
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(200);

        $this->assertSame('suspended', $user->refresh()->status);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'new-password'])
            ->assertStatus(400)->assertJson(['error' => 'Your account has been suspended.']);
    }

    public function test_reset_never_changes_the_users_role()
    {
        $user = User::factory()->create(['status' => 'approved', 'role' => 'admin']);
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(200);

        $this->assertSame('admin', $user->refresh()->role);
    }
}
