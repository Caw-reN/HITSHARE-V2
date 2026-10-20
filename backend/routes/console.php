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

// Periodic cookie health check & automated Telegram alert (every 30 minutes)
\Illuminate\Support\Facades\Schedule::call(function () {
    app(\App\Services\CookieVerifierService::class)->verifyAllAccounts(true);
})->everyThirtyMinutes()->name('cookies:health-check');

Artisan::command('cookies:health-check {--passive : Hanya periksa tanggal tanpa probe HTTP}', function () {
    $passive = $this->option('passive');
    $this->info('Memulai pengecekan status login & kadaluarsa cookie...');
    $service = app(\App\Services\CookieVerifierService::class);
    $stats = $service->verifyAllAccounts(!$passive);
    $this->table(
        ['Healthy', 'Expiring Soon', 'Logged Out', 'Expired', 'Empty'],
        [[$stats['healthy'], $stats['expiring_soon'], $stats['logged_out'], $stats['expired'], $stats['empty']]]
    );
    $this->info('Pengecekan selesai!');
})->purpose('Cek status kesehatan dan login cookie akun website secara berkala');
