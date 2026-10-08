<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Rate limiter for login endpoints
        \Illuminate\Support\Facades\RateLimiter::for('login', function (\Illuminate\Http\Request $request) {
            $maxAttempts = (int) env('LOGIN_RATE_MAX', 20);
            $decayMinutes = (int) env('LOGIN_RATE_WINDOW_MINUTES', 1);
            return \Illuminate\Cache\RateLimiting\Limit::perMinutes($decayMinutes, $maxAttempts)->by($request->ip());
        });

        // Rate limiter for registration endpoints
        \Illuminate\Support\Facades\RateLimiter::for('register', function (\Illuminate\Http\Request $request) {
            $maxAttempts = (int) env('REGISTER_RATE_MAX', 10);
            $decayMinutes = (int) env('REGISTER_RATE_WINDOW_MINUTES', 1);
            return \Illuminate\Cache\RateLimiting\Limit::perMinutes($decayMinutes, $maxAttempts)->by($request->ip());
        });

        // Rate limiter for general API endpoints
        \Illuminate\Support\Facades\RateLimiter::for('api', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Rate limiter for tracking clicks
        \Illuminate\Support\Facades\RateLimiter::for('track-click', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->ip());
        });
    }
}
