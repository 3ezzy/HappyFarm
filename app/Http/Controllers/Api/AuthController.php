<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Farm;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\PasswordUpdateRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    /**
     * Register a new user and create their farm
     */
    public function register(RegisterRequest $request)
    {
        // Validation is automatically handled by RegisterRequest

        // New accounts start pending — they need admin approval (see
        // login()) before they can ever obtain a token. Role defaults to
        // 'user'; only the user:make-admin command grants 'admin'.
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'pending',
            'role' => 'user',
        ]);

        // Create farm for the user
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => $user->name . "'s Farm",
        ]);

        // No token: a pending account must not be able to access the
        // application until an admin approves it.
        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'farm' => [
                'id' => $farm->id,
                'name' => $farm->name,
            ],
            'message' => 'Your account has been created and is awaiting administrator approval.',
        ], 201);
    }

    /**
     * Login user
     */
    public function login(LoginRequest $request)
    {
        // Validation is automatically handled by LoginRequest
        
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Checked only after credentials are verified — surfacing a
        // status-specific message to someone who doesn't know the
        // password would leak whether that email belongs to a
        // pending/rejected/suspended account.
        //
        // Suspended blocks everyone, including admins — unlike
        // pending/rejected, there's no bootstrap scenario that needs a
        // suspended admin to log in (another admin did the suspending and
        // can reactivate them), so this check runs unconditionally.
        if ($user->status === 'suspended') {
            return response()->json(['error' => 'Your account has been suspended.'], 400);
        }

        // Admins bypass the pending/rejected gate (the user:make-admin
        // command deliberately leaves status untouched, so the first
        // admin — created while still 'pending' — must still be able to
        // log in to approve anyone, including themselves).
        if ($user->role !== 'admin') {
            if ($user->status === 'pending') {
                return response()->json(['error' => 'Your account is awaiting administrator approval.'], 400);
            }

            if ($user->status === 'rejected') {
                return response()->json(['error' => 'Your account has been rejected.'], 400);
            }
        }

        // Load the user's farm
        $farm = $user->farm;

        // Generate Sanctum token
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'farm' => [
                'id' => $farm->id,
                'name' => $farm->name,
            ],
            'token' => $token,
        ]);
    }

    /**
     * Change the authenticated user's password. Requires the current
     * password (enforced by PasswordUpdateRequest's current_password
     * rule). Deliberately does not revoke the current token or any other
     * device's tokens — forced logout elsewhere is out of scope for now.
     */
    public function updatePassword(PasswordUpdateRequest $request)
    {
        $request->user()->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Password updated successfully']);
    }

    /**
     * Request a password reset link. Always returns the same generic
     * message regardless of whether the email is registered — the broker
     * itself silently no-ops for unknown emails, so nothing is sent, but
     * the response must not reveal that to avoid user enumeration. Status
     * (pending/rejected/suspended) is deliberately not checked here: any
     * account may request and complete a reset, it just won't be able to
     * log in afterward until the existing status/role rules allow it.
     *
     * The broker's own send step (a real network call to the mail
     * transport) is wrapped separately: a transport failure — e.g. a
     * misconfigured or temporarily unreachable SMTP provider — must not
     * turn into a raw 500 or, worse, a response that differs from the
     * normal generic message and thereby leaks that something about this
     * specific request failed. It's logged server-side instead.
     */
    public function forgotPassword(ForgotPasswordRequest $request)
    {
        try {
            Password::sendResetLink($request->only('email'));
        } catch (Throwable $e) {
            Log::error('Password reset link could not be sent.', [
                'email' => $request->email,
                'exception' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'If that email address is registered, a password reset link has been sent.',
        ]);
    }

    /**
     * Complete a password reset. The broker validates the token (exists,
     * matches the email, not expired) and deletes it after a successful
     * reset, making it single-use. Only the password is touched — status
     * and role are never modified, and all existing Sanctum tokens are
     * revoked so every device must log in again with the new password.
     */
    public function resetPassword(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
            }
        );

        // Mapped explicitly rather than via __() — this project has no
        // lang/ files (all backend-supplied error text elsewhere is a
        // literal string, e.g. login()'s status errors), so the broker's
        // translation-key constants would otherwise surface unresolved
        // ("passwords.token") straight to the API response.
        if ($status !== Password::PASSWORD_RESET) {
            $message = match ($status) {
                Password::RESET_THROTTLED => 'Please wait before requesting another password reset.',
                // INVALID_TOKEN and INVALID_USER are deliberately given the
                // same generic message — distinguishing them would leak
                // whether an email address is registered.
                default => 'This password reset link is invalid or has expired.',
            };

            return response()->json(['error' => $message], 400);
        }

        return response()->json(['message' => 'Your password has been reset successfully.']);
    }

    /**
     * Logout user (revoke current token)
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }
} 