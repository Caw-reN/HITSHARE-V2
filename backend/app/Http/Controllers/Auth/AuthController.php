<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Admin;
use App\Models\Setting;
use App\Models\User;
use App\Models\Website;
use App\Models\WebsiteClick;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Helper to get all active websites with their active accounts.
     */
    private function getActiveWebsites(): array
    {
        $websites = Website::with(['category', 'accounts' => function ($query) {
            $query->where('is_active', true);
        }])
        ->where('is_active', true)
        ->orderBy('name')
        ->get();

        $items = [];
        foreach ($websites as $w) {
            $accounts = $w->accounts;
            if ($accounts->isEmpty()) {
                $items[] = [
                    'id'           => $w->id,
                    'name'         => $w->name,
                    'icon'         => $w->icon,
                    'url'          => $w->url,
                    'category'     => $w->category?->name ?? 'Lainnya',
                    'categoryIcon' => $w->category?->icon ?? '',
                    'accounts'     => [],
                ];
            } else {
                $items[] = [
                    'id'           => $w->id,
                    'name'         => $w->name,
                    'icon'         => $w->icon,
                    'url'          => $w->url,
                    'category'     => $w->category?->name ?? 'Lainnya',
                    'categoryIcon' => $w->category?->icon ?? '',
                    'accounts'     => $accounts->map(fn ($a) => [
                        'id'    => $a->id,
                        'label' => $a->label,
                        'value' => $a->cookie_data,
                    ])->toArray(),
                ];
            }
        }

        return $items;
    }

    /**
     * Extension User Login
     */
    public function login(Request $request): JsonResponse
    {
        // Check if extension client version is outdated
        $minVersion = Setting::get('extension_version', '2.0.0');
        $clientVersion = $request->input('version');
        if ($clientVersion && $minVersion && version_compare($clientVersion, $minVersion, '<')) {
            return response()->json([
                'status'          => false,
                'error_code'      => 'UPDATE_REQUIRED',
                'html'            => "Versi ekstensi Anda (v{$clientVersion}) sudah tidak didukung. Harap update ke versi terbaru (v{$minVersion}).",
                'current_version' => $clientVersion,
                'latest_version'  => $minVersion,
                'download_url'    => Setting::get('extension_download_url', '/downloads/extension.zip'),
            ]);
        }

        $email = $request->input('email') ?? $request->input('username');
        $password = $request->input('password');
        $deviceId = $request->input('deviceId');

        if (!$email || !$password) {
            return response()->json(['status' => false, 'html' => 'Silakan masukkan email dan password']);
        }

        $user = User::where('email', trim(strtolower($email)))->first();

        if (!$user) {
            return response()->json(['status' => false, 'html' => 'Akun tidak ditemukan']);
        }

        if (!Hash::check($password, $user->password)) {
            return response()->json(['status' => false, 'html' => 'Password salah']);
        }

        $effectiveStatus = $user->effectiveStatus();

        if ($effectiveStatus === 'inactive') {
            return response()->json([
                'status'     => false,
                'html'       => 'Akun Anda dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.',
                'error_code' => 'ACCOUNT_INACTIVE',
            ]);
        }

        if ($effectiveStatus === 'pending') {
            return response()->json([
                'status'     => false,
                'html'       => 'Akun Anda belum aktif. Silakan login ke dashboard untuk melakukan pembayaran.',
                'error_code' => 'ACCOUNT_PENDING',
            ]);
        }

        $isExpired = ($effectiveStatus === 'expired');

        // Device lock check
        if ($user->device_id && $deviceId && $user->device_id !== $deviceId) {
            return response()->json([
                'status'     => false,
                'html'       => 'Akun ini sedang terkunci di perangkat lain. Silakan login ke Dashboard Website untuk reset perangkat Anda.',
                'error_code' => 'DEVICE_MISMATCH',
            ]);
        }

        if ($deviceId && !$user->device_id) {
            $user->device_id = $deviceId;
            $user->save();
        }

        // Activity log
        ActivityLog::create([
            'user_id'   => $user->id,
            'email'     => $user->email,
            'action'    => $isExpired ? 'login_expired' : 'login',
            'device_id' => $deviceId ?: null,
            'ip'        => $request->ip(),
        ]);

        $daysLeft = $user->daysLeft();
        // Prune stale extension tokens for this user before issuing a fresh one
        $user->tokens()->where('name', 'extension-token')->delete();
        $token = $user->createToken('extension-token')->plainTextToken;

        if ($isExpired) {
            return response()->json([
                'status'            => true,
                'locked'            => true,
                'token'             => $token,
                'error_code'        => 'ACCOUNT_EXPIRED',
                'expires_at'        => $user->expires_at?->toISOString(),
                'days_left'         => $daysLeft,
                'items'             => [],
                'synced_at'         => now()->toISOString(),
                'extension_version' => $minVersion,
                'download_url'      => Setting::get('extension_download_url', '/downloads/extension.zip'),
            ]);
        }

        $items = $this->getActiveWebsites();

        return response()->json([
            'status'            => true,
            'locked'            => false,
            'token'             => $token,
            'items'             => $items,
            'expires_at'        => $user->expires_at?->toISOString(),
            'days_left'         => $daysLeft,
            'synced_at'         => now()->toISOString(),
            'extension_version' => $minVersion,
            'download_url'      => Setting::get('extension_download_url', '/downloads/extension.zip'),
        ]);
    }

    /**
     * Extension User Registration
     */
    public function register(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $email = $request->input('email');
        $phone = $request->input('phone');
        $password = $request->input('password');

        if (!$name || !$email || !$phone || !$password) {
            return response()->json(['status' => false, 'html' => 'Semua field harus diisi']);
        }

        if (strlen($password) < 6) {
            return response()->json(['status' => false, 'html' => 'Password minimal 6 karakter']);
        }

        $emailClean = trim(strtolower($email));
        if (User::where('email', $emailClean)->exists()) {
            return response()->json(['status' => false, 'html' => 'Email sudah terdaftar']);
        }

        $regEnabled = Setting::get('registration_enabled', 'true');
        if ($regEnabled === 'false') {
            return response()->json(['status' => false, 'html' => 'Registrasi sedang ditutup. Hubungi admin.']);
        }

        User::create([
            'name'      => $name,
            'email'     => $emailClean,
            'phone'     => $phone,
            'password'  => $password,
            'is_active' => false,
            'status'    => 'pending',
        ]);

        return response()->json([
            'status' => true,
            'html'   => 'Pendaftaran berhasil! Silakan login ke dashboard untuk melakukan pembayaran dan aktivasi akun.',
        ]);
    }

    /**
     * Extension Auto-sync
     */
    public function sync(Request $request): JsonResponse
    {
        // Check if extension client version is outdated
        $minVersion = Setting::get('extension_version', '2.0.0');
        $clientVersion = $request->input('version');
        if ($clientVersion && $minVersion && version_compare($clientVersion, $minVersion, '<')) {
            return response()->json([
                'status'          => false,
                'error_code'      => 'UPDATE_REQUIRED',
                'html'            => "Versi ekstensi Anda (v{$clientVersion}) sudah tidak didukung. Harap update ke versi terbaru (v{$minVersion}).",
                'current_version' => $clientVersion,
                'latest_version'  => $minVersion,
                'download_url'    => Setting::get('extension_download_url', '/downloads/extension.zip'),
            ]);
        }

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status'     => false,
                'html'       => 'Sesi tidak valid, silakan login ulang',
                'error_code' => 'SESSION_INVALID',
            ], 401);
        }

        $deviceId = $request->input('deviceId');

        if (!$deviceId) {
            return response()->json(['status' => false, 'html' => 'Data sesi perangkat tidak valid']);
        }

        $effectiveStatus = $user->effectiveStatus();

        if ($effectiveStatus === 'inactive') {
            return response()->json([
                'status'     => false,
                'html'       => 'Akun Anda dinonaktifkan. Hubungi admin.',
                'error_code' => 'ACCOUNT_INACTIVE',
            ]);
        }

        if ($effectiveStatus === 'pending') {
            return response()->json([
                'status'     => false,
                'html'       => 'Akun belum aktif. Silakan login ke dashboard untuk pembayaran.',
                'error_code' => 'ACCOUNT_PENDING',
            ]);
        }

        $isExpired = ($effectiveStatus === 'expired');

        if ($user->device_id && $user->device_id !== $deviceId) {
            return response()->json([
                'status'     => false,
                'html'       => 'Sesi perangkat tidak cocok. Silakan login ke Dashboard Website untuk reset perangkat Anda.',
                'error_code' => 'DEVICE_MISMATCH',
            ]);
        }

        $daysLeft = $user->daysLeft();

        if ($isExpired) {
            return response()->json([
                'status'            => true,
                'locked'            => true,
                'error_code'        => 'ACCOUNT_EXPIRED',
                'expires_at'        => $user->expires_at?->toISOString(),
                'days_left'         => $daysLeft,
                'items'             => [],
                'synced_at'         => now()->toISOString(),
                'extension_version' => $minVersion,
                'download_url'      => Setting::get('extension_download_url', '/downloads/extension.zip'),
            ]);
        }

        $items = $this->getActiveWebsites();

        return response()->json([
            'status'            => true,
            'locked'            => false,
            'items'             => $items,
            'expires_at'        => $user->expires_at?->toISOString(),
            'days_left'         => $daysLeft,
            'synced_at'         => now()->toISOString(),
            'extension_version' => $minVersion,
            'download_url'      => Setting::get('extension_download_url', '/downloads/extension.zip'),
        ]);
    }

    /**
     * Track Website Click
     */
    public function trackClick(Request $request): JsonResponse
    {
        $websiteName = $request->input('websiteName');
        if (!$websiteName) {
            return response()->json(['ok' => false]);
        }

        WebsiteClick::create([
            'website_name' => $websiteName,
            'website_url'  => $request->input('websiteUrl', ''),
            'user_email'   => $request->input('email', ''),
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Public Settings
     */
    public function publicSettings(): JsonResponse
    {
        $keys = [
            'whatsapp_number',
            'site_name',
            'contact_message',
            'registration_enabled',
            'logo_url',
            'favicon_url',
            'extension_version',
            'extension_download_url',
            'extension_file_size',
            'extension_updated_at',
        ];

        $settings = Setting::whereIn('key', $keys)->pluck('value', 'key')->toArray();

        if (empty($settings['extension_version'])) {
            $settings['extension_version'] = '2.0.0';
        }
        if (empty($settings['extension_download_url'])) {
            $settings['extension_download_url'] = '/downloads/extension.zip';
        }

        return response()->json($settings);
    }

    /**
     * Unified Login (Web dashboard / admin panel)
     */
    public function unifiedLogin(Request $request): JsonResponse
    {
        $rawIdentifier = trim($request->input('email', ''));
        $password = $request->input('password');

        if (!$rawIdentifier || !$password) {
            return response()->json(['error' => 'Email/username dan password harus diisi'], 400);
        }

        // 1. Check Admin by username (case-insensitive & exact check)
        $admin = Admin::where('username', $rawIdentifier)
            ->orWhere('username', strtolower($rawIdentifier))
            ->first();

        if ($admin && Hash::check($password, $admin->password)) {
            $admin->tokens()->where('name', 'admin-token')->delete();
            $token = $admin->createToken('admin-token')->plainTextToken;
            return response()->json([
                'role'       => 'admin',
                'admin_role' => $admin->role ?? 'operator',
                'token'      => $token,
                'username'   => $admin->username,
                'redirect'   => '/admin',
            ]);
        }

        // 2. Check User by email (lowercased)
        $user = User::where('email', strtolower($rawIdentifier))->first();
        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json(['error' => 'Email/username atau password salah'], 401);
        }

        $effectiveStatus = $user->effectiveStatus();
        if ($effectiveStatus === 'inactive') {
            return response()->json([
                'error'      => 'Akun Anda dinonaktifkan oleh admin. Hubungi admin untuk informasi lebih lanjut.',
                'error_code' => 'ACCOUNT_INACTIVE',
            ], 403);
        }

        $daysLeft = $user->daysLeft();
        $user->tokens()->where('name', 'user-token')->delete();
        $token = $user->createToken('user-token')->plainTextToken;

        ActivityLog::create([
            'user_id' => $user->id,
            'email'   => $user->email,
            'action'  => 'web_login',
            'ip'      => $request->ip(),
        ]);

        return response()->json([
            'role'     => 'user',
            'token'    => $token,
            'redirect' => '/akun',
            'user'     => [
                'id'             => $user->id,
                'name'           => $user->name ?? '',
                'email'          => $user->email,
                'phone'          => $user->phone,
                'is_active'      => $user->is_active,
                'expires_at'     => $user->expires_at?->toISOString(),
                'days_left'      => $daysLeft,
                'account_status' => $effectiveStatus,
                'created_at'     => $user->created_at?->toISOString(),
            ],
        ]);
    }
}
