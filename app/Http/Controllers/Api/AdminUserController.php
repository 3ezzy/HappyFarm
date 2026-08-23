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
