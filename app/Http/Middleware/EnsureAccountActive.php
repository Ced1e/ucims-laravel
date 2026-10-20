<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountActive
{
    /**
     * Sign out any user whose account an admin has disabled.
     * Strict "=== false" so a missing/unmigrated column never locks everyone out.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->is_active === false) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json(['message' => 'This account has been disabled.'], 401);
            }

            return redirect()->route('login')->withErrors([
                'clinic_id' => 'This account has been disabled. Please contact the clinic administrator.',
            ]);
        }

        return $next($request);
    }
}
