<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gates the /api/admin/* routes. Runs inside the auth:sanctum group, so
 * $request->user() is always the authenticated user here — this only adds
 * the role check on top.
 */
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json(['error' => 'You do not have permission to access this resource.'], 403);
        }

        return $next($request);
    }
}
