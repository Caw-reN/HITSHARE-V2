<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Must be an Admin model instance (not User)
        if (!$user || !($user instanceof \App\Models\Admin)) {
            return response()->json(['error' => 'Akses ditolak. Hanya admin yang dapat mengakses.'], 403);
        }

        return $next($request);
    }
}
