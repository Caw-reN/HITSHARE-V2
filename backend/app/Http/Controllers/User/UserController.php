<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * User Login for Web Dashboard
     */
    public function login(Request $request): JsonResponse
    {
        $email = trim(strtolower($request->input('email', '')));
        $password = $request->input('password');

        if (!$email || !$password) {
            return response()->json(['error' => 'Email dan password harus diisi'], 400);
        }

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json(['error' => 'Email atau password salah'], 401);
        }

        $effectiveStatus = $user->effectiveStatus();

        if ($effectiveStatus === 'inactive') {
            return response()->json([
                'error'      => 'Akun Anda dinonaktifkan oleh admin. Hubungi admin untuk informasi lebih lanjut.',
                'error_code' => 'ACCOUNT_INACTIVE',
            ], 403);
        }

        $user->tokens()->where('name', 'user-token')->delete();
        $token = $user->createToken('user-token')->plainTextToken;

        ActivityLog::create([
            'user_id' => $user->id,
            'email'   => $user->email,
            'action'  => 'web_login',
            'ip'      => $request->ip(),
        ]);

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'             => $user->id,
                'name'           => $user->name ?? '',
                'email'          => $user->email,
                'phone'          => $user->phone,
                'is_active'      => $user->is_active,
                'is_affiliate'   => (bool) $user->is_affiliate,
                'affiliate_code' => $user->affiliate_code,
                'expires_at'     => $user->expires_at?->toISOString(),
                'days_left'      => $user->daysLeft(),
                'account_status' => $effectiveStatus,
                'created_at'     => $user->created_at?->toISOString(),
            ],
        ]);
    }

    /**
     * Get User Profile
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        $settingsKeys = [
            'whatsapp_number',
            'site_name',
            'contact_message',
            'extension_download_url',
            'extension_file_size',
            'extension_updated_at',
            'extension_version',
        ];

        $settings = Setting::whereIn('key', $settingsKeys)->pluck('value', 'key')->toArray();
        if (empty($settings['extension_version'])) {
            $settings['extension_version'] = '2.0.0';
        }

        $daysLeft = method_exists($user, 'daysLeft') ? $user->daysLeft() : 9999;
        $accountStatus = method_exists($user, 'effectiveStatus') ? $user->effectiveStatus() : 'active';

        return response()->json([
            'id'             => $user->id,
            'name'           => $user->name ?? '',
            'email'          => $user->email,
            'phone'          => $user->phone ?? '',
            'is_active'      => $user->is_active ?? true,
            'is_affiliate'   => (bool) $user->is_affiliate,
            'affiliate_code' => $user->affiliate_code,
            'status'         => $user->status ?? 'active',
            'expires_at'     => $user->expires_at ? $user->expires_at->toISOString() : null,
            'created_at'     => $user->created_at ? $user->created_at->toISOString() : null,
            'device_id'      => $user->device_id ?? null,
            'days_left'      => $daysLeft,
            'account_status' => $accountStatus,
            'settings'       => $settings,
        ]);
    }

    /**
     * Update Profile (Phone)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $phone = $request->input('phone');
        if (!$phone) {
            return response()->json(['error' => 'Nomor HP harus diisi'], 400);
        }

        $phoneClean = preg_replace('/\D/', '', $phone);
        if (strlen($phoneClean) < 9 || strlen($phoneClean) > 15) {
            return response()->json(['error' => 'Nomor HP tidak valid'], 400);
        }

        $user = $request->user();
        if ($phone) {
            $user->phone = $phone;
        }
        if ($request->has('name')) {
            $user->name = trim((string) $request->input('name'));
        }
        $user->save();

        return response()->json(['message' => 'Profil berhasil diperbarui']);
    }

    /**
     * Change Password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $currentPassword = $request->input('currentPassword');
        $newPassword = $request->input('newPassword');

        if (!$currentPassword || !$newPassword) {
            return response()->json(['error' => 'Password lama dan baru harus diisi'], 400);
        }

        if (strlen($newPassword) < 6) {
            return response()->json(['error' => 'Password baru minimal 6 karakter'], 400);
        }

        $user = $request->user();

        if (!Hash::check($currentPassword, $user->password)) {
            return response()->json(['error' => 'Password lama tidak sesuai'], 401);
        }

        $user->password = $newPassword; // Hashed by model cast
        $user->tokens()->delete();
        $user->save();

        // Create a new token for the current active web session
        $newToken = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Password berhasil diubah. Seluruh sesi lain telah dicabut demi keamanan.',
            'token'   => $newToken,
        ]);
    }

    /**
     * User self-service reset device ID
     */
    public function resetDevice(Request $request): JsonResponse
    {
        $user = $request->user();

        $maxResets = 15;
        $windowDays = 30;

        // Reset the counter if window has passed
        if ($user->last_device_reset_at && $user->last_device_reset_at->diffInDays(now()) >= $windowDays) {
            $user->device_reset_count = 0;
        }

        if (($user->device_reset_count ?? 0) >= $maxResets) {
            $nextAllowed = $user->last_device_reset_at
                ? $user->last_device_reset_at->copy()->addDays($windowDays)->locale('id')->diffForHumans()
                : "dalam {$windowDays} hari";

            return response()->json([
                'error' => "Batas reset perangkat mandiri tercapai (maksimal {$maxResets}x per {$windowDays} hari). Anda dapat mereset kembali {$nextAllowed}, atau hubungi admin untuk bantuan.",
                'remaining_resets' => 0,
            ], 429);
        }

        $user->device_id = null;
        $user->device_reset_count = ($user->device_reset_count ?? 0) + 1;
        $user->last_device_reset_at = now();
        $user->save();

        $remaining = max(0, $maxResets - $user->device_reset_count);

        ActivityLog::create([
            'user_id' => $user->id,
            'email'   => $user->email,
            'action'  => 'user_reset_device',
            'ip'      => $request->ip(),
        ]);

        return response()->json([
            'message'          => "Kunci perangkat berhasil direset. Sisa kuota reset Anda: {$remaining}x dalam 30 hari. Silakan buka ekstensi dan login di perangkat/browser baru Anda.",
            'device_id'        => null,
            'remaining_resets' => $remaining,
        ]);
    }

    /**
     * User Payment History
     */
    public function paymentHistory(Request $request): JsonResponse
    {
        $user = $request->user();

        // Auto expire pending orders that have passed expiration time
        Order::where('user_id', $user->id)
            ->where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

        $orders = Order::where('user_id', $user->id)
            ->select([
                'id', 'order_id', 'plan', 'amount', 'duration_days', 'status',
                'paid_at', 'expires_at', 'qr_url', 'qr_string', 'created_at',
                'original_amount', 'discount_amount', 'voucher_code', 'admin_fee',
            ])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json($orders);
    }

    /**
     * Renewal Info
     */
    public function renewalInfo(Request $request): JsonResponse
    {
        $user = $request->user();

        $settings = Setting::whereIn('key', ['whatsapp_number', 'contact_message', 'site_name'])
            ->pluck('value', 'key')
            ->toArray();

        return response()->json([
            'whatsapp_number' => $settings['whatsapp_number'] ?? '',
            'contact_message' => $settings['contact_message'] ?? 'Hubungi kami untuk perpanjangan',
            'expires_at'      => $user->expires_at?->toISOString(),
            'days_left'       => $user->daysLeft(),
            'is_active'       => $user->is_active,
        ]);
    }
}
