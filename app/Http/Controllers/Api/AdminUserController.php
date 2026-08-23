<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Admin-only user management (see EnsureUserIsAdmin, applied to the whole
 * /api/admin/* route group). Deliberately not farm-scoped — unlike every
 * other controller in this app, an admin reviews registrations across the
 * whole application, not just their own farm.
 */
class AdminUserController extends Controller
{
    /**
     * List users, optionally filtered by status. Uses the Eloquent model
     * (not a raw query) so $hidden (password, remember_token) stays
     * enforced automatically.
     */
    public function index(Request $request)
    {
        $query = User::query()->with('farm')->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return response()->json($query->get()->map(fn (User $user) => $this->present($user)));
    }

    /**
     * Approve a pending user. Restricted to status='pending' so this can
     * never be used to touch an already-decided account — there is no
     * approval revocation, and re-deciding a rejected user isn't in scope.
     */
    public function approve(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($user->status !== 'pending') {
            return response()->json(['error' => 'Only pending users can be approved.'], 400);
        }

        $user->update(['status' => 'approved']);

        return response()->json($this->present($user->load('farm')));
    }

    /**
     * Reject a pending user. Same pending-only restriction as approve().
     */
    public function reject(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($user->status !== 'pending') {
            return response()->json(['error' => 'Only pending users can be rejected.'], 400);
        }

        $user->update(['status' => 'rejected']);

        return response()->json($this->present($user->load('farm')));
    }

    /**
     * Suspend an approved user: takes access away immediately, not just at
     * their next login. Restricted to status='approved' so this is the
     * only path that can ever remove access from a decided-and-working
     * account — there is no path from pending/rejected straight to
     * suspended. tokens()->delete() revokes every device/session this
     * user is currently logged in on; Sanctum is fully DB-backed, so once
     * those rows are gone the very next request with any of those tokens
     * fails auth:sanctum on its own, with no extra per-request check
     * needed anywhere else in the app.
     */
    public function suspend(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // An admin must not be able to lock themselves out — checked
        // before the status check so this is always the specific message,
        // not whatever "only approved users..." happens to say for their
        // own current status.
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'You cannot suspend your own account.'], 400);
        }

        if ($user->status !== 'approved') {
            return response()->json(['error' => 'Only approved users can be suspended.'], 400);
        }

        $user->update(['status' => 'suspended']);
        $user->tokens()->delete();

        return response()->json($this->present($user->load('farm')));
    }

    /**
     * Reactivate a suspended user back to approved. No token action needed
     * — they log in fresh and get a new one, same as any other approved
     * user. No self-action guard needed here: a suspended admin has no
     * valid token (suspend() just revoked them all) and login() blocks
     * suspended accounts unconditionally, so self-reactivation is already
     * impossible by construction, not just discouraged.
     */
    public function reactivate(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        if ($user->status !== 'suspended') {
            return response()->json(['error' => 'Only suspended users can be reactivated.'], 400);
        }

        $user->update(['status' => 'approved']);

        return response()->json($this->present($user->load('farm')));
    }

    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'farm_name' => $user->farm?->name,
            'status' => $user->status,
            'role' => $user->role,
            // Date-only, matching every other date field in this API
            // (date_of_birth, bred_on, etc.) — fmtDate() on the frontend
            // is built specifically for that shape.
            'created_at' => $user->created_at?->toDateString(),
        ];
    }
}
