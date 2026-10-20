<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Allow the request only if the authenticated user has one of the given roles.
     * Usage: ->middleware('role:admin') or ->middleware('role:nurse,doctor,admin')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'You are not authorized to perform this action.'], 403);
            }

            abort(403, 'You are not authorized to access this page.');
        }

        return $next($request);
    }
}
