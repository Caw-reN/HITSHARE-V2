<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SuperAdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || !($user instanceof \App\Models\Admin) || $user->role !== 'superadmin') {
            return response()->json(['error' => 'Akses ditolak. Hanya Super Admin yang dapat melakukan tindakan ini.'], 403);
        }

        return $next($request);
    }
}
