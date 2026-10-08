<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Prune expired personal access tokens daily
\Illuminate\Support\Facades\Schedule::command('sanctum:prune-expired --hours=24')->daily();

// Auto-expire stale pending orders past expiration time every 10 minutes
\Illuminate\Support\Facades\Schedule::call(function () {
    \App\Models\Order::where('status', 'pending')
        ->whereNotNull('expires_at')
        ->where('expires_at', '<', now())
        ->update(['status' => 'expired']);
})->everyTenMinutes()->name('orders:auto-expire-pending');
