<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AffiliateEarning;
use App\Models\Order;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    private const PAYMENKU_BASE = 'https://paymenku.com/api/v1';
    private const QRIS_FEE_PERCENT = 0.7;
    private const QRIS_FEE_FIXED = 200;

    /**
     * Subscription plans loaded dynamically from database
     */
    private function getPlansConfig(): array
    {
        $plans = Plan::where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        if ($plans->isNotEmpty()) {
            $config = [];
            foreach ($plans as $p) {
                $config[$p->plan] = [
                    'id'            => $p->id,
                    'key'           => $p->plan,
                    'plan'          => $p->plan,
                    'label'         => $p->label,
                    'amount'        => (int) $p->amount,
                    'duration_days' => (int) $p->duration_days,
                    'original'      => (int) ($p->original_price ?? 0),
                    'badge'         => $p->badge,
                    'description'   => $p->description,
                ];
            }
            return $config;
        }

        // Fallback default plans
        return [
            'monthly' => [
                'plan'          => 'monthly',
                'label'         => '1 Bulan',
                'amount'        => 25000,
                'duration_days' => 30,
                'original'      => 35000,
                'badge'         => null,
                'description'   => 'Akses penuh 30 hari',
            ],
            '6months' => [
                'plan'          => '6months',
                'label'         => '6 Bulan',
                'amount'        => 120000,
                'duration_days' => 180,
                'original'      => 150000,
                'badge'         => 'Hemat 20%',
                'description'   => '~Rp 20.000/bln',
            ],
            'yearly' => [
                'plan'          => 'yearly',
                'label'         => '1 Tahun',
                'amount'        => 200000,
                'duration_days' => 365,
                'original'      => 300000,
                'badge'         => 'Terbaik',
                'description'   => '~Rp 16.667/bln',
            ],
        ];
    }

    /**
     * Paymenku credentials
     */
    private function getPaymenkuConfig(): array
    {
        $settings = Setting::getMany([
            'paymenku_api_key',
            'paymenku_webhook_secret',
            'paymenku_is_production',
            'paymenku_sandbox_api_key',
            'paymenku_sandbox_webhook_secret',
            'paymenku_prod_api_key',
            'paymenku_prod_webhook_secret',
        ]);

        $isProd = ($settings['paymenku_is_production'] ?? env('PAYMENKU_IS_PRODUCTION', 'false')) === 'true';

        if ($isProd) {
            $apiKey = !empty($settings['paymenku_prod_api_key'])
                ? $settings['paymenku_prod_api_key']
                : ($settings['paymenku_api_key'] ?? env('PAYMENKU_API_KEY', ''));

            $webhookSecret = !empty($settings['paymenku_prod_webhook_secret'])
                ? $settings['paymenku_prod_webhook_secret']
                : ($settings['paymenku_webhook_secret'] ?? env('PAYMENKU_WEBHOOK_SECRET', ''));
        } else {
            $apiKey = !empty($settings['paymenku_sandbox_api_key'])
                ? $settings['paymenku_sandbox_api_key']
                : ($settings['paymenku_api_key'] ?? env('PAYMENKU_API_KEY', ''));

            $webhookSecret = !empty($settings['paymenku_sandbox_webhook_secret'])
                ? $settings['paymenku_sandbox_webhook_secret']
                : ($settings['paymenku_webhook_secret'] ?? env('PAYMENKU_WEBHOOK_SECRET', ''));
        }

        return [
            'apiKey'        => $apiKey,
            'webhookSecret' => $webhookSecret,
            'isProd'        => $isProd,
        ];
    }

    /**
     * Request to Paymenku API
     */
    private function paymenkuRequest(string $method, string $endpoint, ?array $body = null): array
    {
        $config = $this->getPaymenkuConfig();
        if (empty($config['apiKey'])) {
            throw new Exception('Paymenku API Key belum dikonfigurasi. Atur di Pengaturan → Integrasi Paymenku.');
        }

        $url = self::PAYMENKU_BASE . $endpoint;
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $config['apiKey'],
            'Accept'        => 'application/json',
            'Content-Type'  => 'application/json',
        ])->send($method, $url, [
            'json' => $body,
        ]);

        $data = $response->json() ?? [];

        if (!$response->successful() || ($data['status'] ?? '') === 'error') {
            $msg = $data['message'] ?? 'Paymenku API error: HTTP ' . $response->status();
            throw new Exception($msg);
        }

        return $data;
    }

    /**
     * Validate voucher
     */
    private function validateVoucherLogic(string $code, int $userId, string $plan, int $amount): array
    {
        $upperCode = strtoupper(trim($code));
        if (empty($upperCode)) {
            return ['valid' => false, 'error' => 'Kode voucher kosong'];
        }

        $voucher = Voucher::where('code', $upperCode)->first();
        if (!$voucher) {
            return ['valid' => false, 'error' => 'Kode voucher tidak ditemukan'];
        }

        if (!$voucher->is_active) {
            return ['valid' => false, 'error' => 'Voucher tidak aktif'];
        }

        $now = now();
        if ($voucher->valid_until && $voucher->valid_until->isPast()) {
            return ['valid' => false, 'error' => 'Voucher sudah kadaluwarsa'];
        }

        if ($voucher->valid_from && $voucher->valid_from->isFuture()) {
            return ['valid' => false, 'error' => 'Voucher belum berlaku'];
        }

        if ($voucher->max_uses > 0 && $voucher->used_count >= $voucher->max_uses) {
            return ['valid' => false, 'error' => 'Voucher sudah habis dipakai'];
        }

        if ($voucher->applies_to !== 'all' && $voucher->applies_to !== $plan) {
            return ['valid' => false, 'error' => "Voucher hanya untuk paket {$voucher->applies_to}"];
        }

        if ($voucher->min_amount > 0 && $amount < $voucher->min_amount) {
            return ['valid' => false, 'error' => 'Minimal pembelian Rp ' . number_format($voucher->min_amount, 0, ',', '.')];
        }

        if ($userId > 0) {
            $alreadyUsed = VoucherUsage::where('voucher_id', $voucher->id)
                ->where('user_id', $userId)
                ->exists();

            if ($alreadyUsed) {
                return ['valid' => false, 'error' => 'Anda sudah pernah menggunakan voucher ini'];
            }
        }

        $discount = 0;
        if ($voucher->discount_type === 'percent') {
            $discount = (int) floor($amount * $voucher->discount_value / 100);
        } else {
            $discount = $voucher->discount_value;
        }

        $discount = min($discount, $amount);

        return [
            'valid'        => true,
            'voucher'      => $voucher,
            'discount'     => $discount,
            'final_amount' => $amount - $discount,
        ];
    }

    /**
     * Public Plans list
     */
    public function plans(): JsonResponse
    {
        $plans = $this->getPlansConfig();
        $list = [];
        foreach ($plans as $key => $val) {
            $list[] = array_merge(['key' => $key], $val);
        }

        return response()->json($list);
    }

    /**
     * Validate Voucher endpoint
     */
    public function validateVoucher(Request $request): JsonResponse
    {
        $code = $request->input('code');
        $plan = $request->input('plan');
        $plans = $this->getPlansConfig();

        if (!isset($plans[$plan])) {
            return response()->json(['error' => 'Paket tidak valid'], 400);
        }

        $planData = $plans[$plan];
        $result = $this->validateVoucherLogic($code, $request->user()->id, $plan, $planData['amount']);

        if (!$result['valid']) {
            return response()->json(['error' => $result['error']], 400);
        }

        $adminFee = (int) ceil($result['final_amount'] * self::QRIS_FEE_PERCENT / 100) + self::QRIS_FEE_FIXED;
        $totalPay = $result['final_amount'] + $adminFee;
        $voucher = $result['voucher'];

        return response()->json([
            'valid'           => true,
            'code'            => $voucher->code,
            'discount'        => $result['discount'],
            'final_amount'    => $result['final_amount'],
            'admin_fee'       => $adminFee,
            'total_pay'       => $totalPay,
            'original_amount' => $planData['amount'],
            'description'     => $voucher->description,
            'discount_type'   => $voucher->discount_type,
            'discount_value'  => $voucher->discount_value,
        ]);
    }

    /**
     * Create Order & Request QRIS
     */
    public function create(Request $request): JsonResponse
    {
        $plan = $request->input('plan');
        $plans = $this->getPlansConfig();

        if (!isset($plans[$plan])) {
            return response()->json(['error' => 'Paket langganan tidak valid.'], 400);
        }

        $planData = $plans[$plan];
        $user = $request->user();
        $orderId = 'HSR-' . $user->id . '-' . strtoupper($plan) . '-' . round(microtime(true) * 1000);

        $subtotal = $planData['amount'];
        $discountAmount = 0;
        $appliedVoucher = null;

        $voucherCode = $request->input('voucher_code');
        if ($voucherCode) {
            $voucherResult = $this->validateVoucherLogic($voucherCode, $user->id, $plan, $planData['amount']);
            if ($voucherResult['valid']) {
                $subtotal = $voucherResult['final_amount'];
                $discountAmount = $voucherResult['discount'];
                $appliedVoucher = $voucherResult['voucher'];
            } else {
                return response()->json(['error' => 'Voucher: ' . $voucherResult['error']], 400);
            }
        }

        // Cancel previous pending orders for this user safely with lockForUpdate
        DB::transaction(function () use ($user) {
            Order::where('user_id', $user->id)
                ->where('status', 'pending')
                ->lockForUpdate()
                ->update(['status' => 'cancelled']);
        });

        $customerName = explode('@', $user->email)[0] ?: 'Pelanggan';
        $baseUrl = $request->schemeAndHttpHost();

        try {
            $paymenkuRes = $this->paymenkuRequest('POST', '/transaction/create', [
                'reference_id'   => $orderId,
                'amount'         => $subtotal,
                'customer_name'  => $customerName,
                'customer_email' => $user->email,
                'customer_phone' => $user->phone ?: '08123456789',
                'channel_code'   => 'qris',
                'expiry_period'  => 10, // 10 menit expired
                'return_url'     => "{$baseUrl}/akun?paid={$orderId}",
            ]);
        } catch (Exception $e) {
            Log::error('[payment/create] Paymenku error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }

        $trx = $paymenkuRes['data'] ?? [];
        $trxId = $trx['trx_id'] ?? null;
        $grossAmount = (int) round((float) ($trx['amount'] ?? ($subtotal + ceil($subtotal * self::QRIS_FEE_PERCENT / 100) + self::QRIS_FEE_FIXED)));
        $adminFee = max(0, $grossAmount - $subtotal);
        $qrUrl = $trx['payment_info']['qr_url'] ?? null;
        $qrString = $trx['payment_info']['qr_string'] ?? null;

        $expStr = $trx['payment_info']['expiration_date'] ?? $trx['expiration_date'] ?? null;
        $parsedExp = now()->addMinutes(10);
        if ($expStr) {
            try {
                $gatewayExp = Carbon::parse($expStr);
                if ($gatewayExp->isBefore($parsedExp)) {
                    $parsedExp = $gatewayExp;
                }
            } catch (Exception) {
                // Default to 10 minutes
            }
        }

        // Check affiliate attribution for first purchase
        $commissionAmount = 0;
        $refAffiliate = null;
        if ($user->referred_by_id) {
            $hasPriorPaid = Order::where('user_id', $user->id)->where('status', 'paid')->exists();
            $hasPriorEarnings = AffiliateEarning::where('referred_user_id', $user->id)->exists();
            if (!$hasPriorPaid && !$hasPriorEarnings) {
                $refAffiliate = User::where('id', $user->referred_by_id)->where('is_affiliate', true)->first();
                if ($refAffiliate && $refAffiliate->id !== $user->id) {
                    $affiliateEnabled = Setting::get('affiliate_enabled', '1') !== '0';
                    if ($affiliateEnabled) {
                        $nominalComm = (int) ($refAffiliate->affiliate_commission ?? Setting::get('affiliate_commission_default', 20000));
                        // Anti negative margin: commission cannot exceed order subtotal
                        $commissionAmount = min($nominalComm, max(0, $subtotal));
                    }
                }
            }
        }

        $order = Order::create([
            'user_id'           => $user->id,
            'email'             => $user->email,
            'order_id'          => $orderId,
            'plan'              => $plan,
            'amount'            => $grossAmount,
            'original_amount'   => $planData['amount'],
            'discount_amount'   => $discountAmount,
            'commission_amount' => $commissionAmount,
            'admin_fee'         => $adminFee,
            'duration_days'     => $planData['duration_days'],
            'status'            => 'pending',
            'payment_txn_id'    => $trxId,
            'qr_url'            => $qrUrl,
            'qr_string'         => $qrString,
            'voucher_code'      => $appliedVoucher?->code,
            'referred_by_id'    => $refAffiliate?->id,
            'affiliate_code'    => $refAffiliate?->affiliate_code,
            'expires_at'        => $parsedExp,
        ]);

        return response()->json([
            'order_id'        => $orderId,
            'plan'            => $plan,
            'plan_label'      => $planData['label'],
            'amount'          => $grossAmount,
            'subtotal'        => $subtotal,
            'admin_fee'       => $adminFee,
            'original_amount' => $planData['amount'],
            'discount_amount' => $discountAmount,
            'voucher_code'    => $appliedVoucher?->code,
            'duration_days'   => $planData['duration_days'],
            'qr_url'          => $qrUrl,
            'qr_string'       => $qrString,
            'expires_at'      => $parsedExp->toISOString(),
            'status'          => 'pending',
        ]);
    }

    /**
     * Cancel Pending Order (e.g. before changing plan)
     */
    public function cancel(string $orderId, Request $request): JsonResponse
    {
        $user = $request->user();

        return DB::transaction(function () use ($orderId, $user) {
            $order = Order::where('order_id', $orderId)->lockForUpdate()->first();
            if (!$order) {
                return response()->json(['error' => 'Pesanan tidak ditemukan'], 404);
            }

            if ($order->user_id !== $user->id) {
                return response()->json(['error' => 'Akses ditolak'], 403);
            }

            if ($order->status === 'paid') {
                return response()->json(['error' => 'Pesanan sudah dibayar dan tidak dapat dibatalkan.'], 422);
            }

            if ($order->status !== 'pending') {
                return response()->json(['message' => 'Pesanan sudah tidak aktif', 'status' => $order->status]);
            }

            $order->update(['status' => 'cancelled']);

            return response()->json([
                'message'  => 'Pesanan berhasil dibatalkan',
                'order_id' => $orderId,
                'status'   => 'cancelled',
            ]);
        });
    }

    /**
     * Check Order Status (polling)
     */
    public function status(string $orderId, Request $request): JsonResponse
    {
        $order = Order::where('order_id', $orderId)->first();
        if (!$order) {
            return response()->json(['error' => 'Order tidak ditemukan'], 404);
        }

        if ($order->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Akses ditolak'], 403);
        }

        if ($order->status === 'paid') {
            return response()->json([
                'status'   => 'paid',
                'order_id' => $orderId,
                'paid_at'  => $order->paid_at?->toISOString(),
            ]);
        }

        if (in_array($order->status, ['expired', 'failed', 'cancelled'])) {
            return response()->json(['status' => $order->status, 'order_id' => $orderId]);
        }

        // Auto expire if 10-min expiration has passed
        if ($order->expires_at && now()->isAfter($order->expires_at)) {
            $order->status = 'expired';
            $order->save();
            return response()->json(['status' => 'expired', 'order_id' => $orderId]);
        }

        // Check latest status with Paymenku
        try {
            $result = $this->paymenkuRequest('GET', "/check-status/{$orderId}");
            $pmStatus = $result['data'] ?? [];
            $rawStatus = $pmStatus['status'] ?? 'pending';

            $newStatus = match ($rawStatus) {
                'paid'    => 'paid',
                'failed'  => 'failed',
                'expired' => 'expired',
                default   => 'pending',
            };

            if ($newStatus === 'paid' && $order->status !== 'paid') {
                $this->activateUser($order, $pmStatus['paid_at'] ?? null);
            } elseif ($newStatus !== $order->status) {
                $order->status = $newStatus;
                $order->save();
            }

            return response()->json([
                'status'   => $newStatus,
                'order_id' => $orderId,
                'paid_at'  => $newStatus === 'paid' ? ($order->fresh()->paid_at?->toISOString() ?? now()->toISOString()) : null,
            ]);
        } catch (Exception) {
            return response()->json(['status' => $order->status, 'order_id' => $orderId]);
        }
    }

    /**
     * User Payment History
     */
    public function history(Request $request): JsonResponse
    {
        // Auto expire pending orders that have passed expiration time
        Order::where('user_id', $request->user()->id)
            ->where('status', 'pending')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

        $orders = Order::where('user_id', $request->user()->id)
            ->select('id', 'order_id', 'plan', 'amount', 'duration_days', 'status', 'qr_url', 'qr_string', 'expires_at', 'paid_at', 'created_at', 'original_amount', 'discount_amount', 'voucher_code', 'admin_fee')
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json($orders);
    }

    /**
     * Paymenku Webhook
     *
     * Security: Fail-Closed design — webhook is REJECTED if secret is not configured.
     * Also validates timestamp drift to prevent replay attacks.
     */
    public function webhook(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $timestamp = $request->header('x-paymenku-timestamp');
        $signature = $request->header('x-paymenku-signature');

        $config = $this->getPaymenkuConfig();

        // ── SEC-02 FIX: Fail-Closed — reject if webhook secret is not configured ──
        if (empty($config['webhookSecret'])) {
            Log::critical('[Webhook] PAYMENKU_WEBHOOK_SECRET is not configured! Webhook request REJECTED for security. Configure the secret in admin settings or .env before accepting webhooks.', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Webhook service is not configured. Contact administrator.'], 500);
        }

        // ── Validate required signature headers ──
        if (!$timestamp || !$signature) {
            Log::warning('[Webhook] Missing signature headers.', [
                'ip'        => $request->ip(),
                'has_ts'    => !empty($timestamp),
                'has_sig'   => !empty($signature),
            ]);
            return response()->json(['error' => 'Missing signature headers'], 401);
        }

        // ── Validate timestamp drift (max 5 minutes) to prevent replay attacks ──
        $maxDriftSeconds = 300; // 5 minutes
        $tsInt = (int) $timestamp;
        if ($tsInt <= 0 || abs(time() - $tsInt) > $maxDriftSeconds) {
            Log::warning('[Webhook] Timestamp drift exceeded threshold. Possible replay attack.', [
                'ip'             => $request->ip(),
                'received_ts'    => $timestamp,
                'server_time'    => time(),
                'drift_seconds'  => abs(time() - $tsInt),
                'max_allowed'    => $maxDriftSeconds,
            ]);
            return response()->json(['error' => 'Timestamp expired or invalid'], 401);
        }

        // ── Verify HMAC signature ──
        $secretsToTry = array_values(array_unique(array_filter([
            $config['webhookSecret'],
            Setting::get('paymenku_sandbox_webhook_secret'),
            Setting::get('paymenku_prod_webhook_secret'),
            Setting::get('paymenku_webhook_secret'),
            env('PAYMENKU_WEBHOOK_SECRET', ''),
        ])));

        $validSignature = false;
        foreach ($secretsToTry as $sec) {
            $computed = hash_hmac('sha256', "{$timestamp}.{$rawBody}", $sec);
            if (hash_equals($signature, $computed)) {
                $validSignature = true;
                break;
            }
        }

        if (!$validSignature) {
            Log::warning('[Webhook] Invalid HMAC signature. Request rejected.', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // ── Signature verified — process payload ──
        $payload = $request->json()->all();
        $orderId = $payload['reference_id'] ?? null;
        $pmStatus = $payload['status'] ?? 'pending';

        if (!$orderId) {
            return response()->json(['error' => 'reference_id missing'], 400);
        }

        $order = Order::where('order_id', $orderId)->first();
        if (!$order) {
            Log::info("[Webhook] Order not found for reference_id: {$orderId}. Ignoring.");
            return response()->json(['ok' => true]);
        }

        $newStatus = match ($pmStatus) {
            'paid'    => 'paid',
            'failed'  => 'failed',
            'expired' => 'expired',
            default   => 'pending',
        };

        if ($newStatus === 'paid' && $order->status !== 'paid') {
            $this->activateUser($order, $payload['paid_at'] ?? null);
            Log::info("[Webhook] Order {$orderId} activated via webhook. User #{$order->user_id}.");
        } elseif ($newStatus !== $order->status) {
            $order->status = $newStatus;
            $order->save();
            Log::info("[Webhook] Order {$orderId} status updated to '{$newStatus}'.");
        }

        return response()->json(['received' => true]);
    }

    /**
     * Public Registration Voucher Validation
     */
    public function registerValidateVoucher(Request $request): JsonResponse
    {
        $code = $request->input('code');
        $plan = $request->input('plan');
        $plans = $this->getPlansConfig();

        if (!isset($plans[$plan])) {
            return response()->json(['error' => 'Paket tidak valid'], 400);
        }

        $planData = $plans[$plan];
        $result = $this->validateVoucherLogic($code, 0, $plan, $planData['amount']);

        if (!$result['valid']) {
            return response()->json(['error' => $result['error']], 400);
        }

        $adminFee = (int) ceil($result['final_amount'] * self::QRIS_FEE_PERCENT / 100) + self::QRIS_FEE_FIXED;
        $totalPay = $result['final_amount'] + $adminFee;
        $voucher = $result['voucher'];

        return response()->json([
            'valid'           => true,
            'code'            => $voucher->code,
            'discount'        => $result['discount'],
            'final_amount'    => $result['final_amount'],
            'admin_fee'       => $adminFee,
            'total_pay'       => $totalPay,
            'original_amount' => $planData['amount'],
            'description'     => $voucher->description,
            'discount_type'   => $voucher->discount_type,
            'discount_value'  => $voucher->discount_value,
        ]);
    }

    /**
     * Public Registration with Immediate Payment Checkout
     */
    public function registerCheckout(Request $request): JsonResponse
    {
        $name = trim((string) $request->input('name', ''));
        $email = $request->input('email');
        $phone = $request->input('phone');
        $password = $request->input('password');
        $plan = $request->input('plan');

        if (!$name || !$email || !$phone || !$password || !$plan) {
            return response()->json(['error' => 'Semua kolom wajib diisi'], 422);
        }

        if (strlen($password) < 6) {
            return response()->json(['error' => 'Password minimal 6 karakter'], 422);
        }

        $emailClean = trim(strtolower($email));
        $phoneClean = trim($phone);

        $regEnabled = Setting::get('registration_enabled', 'true');
        if ($regEnabled === 'false') {
            return response()->json(['error' => 'Registrasi sedang ditutup. Hubungi admin.'], 403);
        }

        $plans = $this->getPlansConfig();
        if (!isset($plans[$plan])) {
            return response()->json(['error' => 'Pilihan paket langganan tidak valid.'], 400);
        }

        $existingUser = User::where('email', $emailClean)->first();
        if ($existingUser) {
            $hasPaidOrders = $existingUser->orders()->where('status', 'paid')->exists();
            $isPending = ($existingUser->status === 'pending' || !$existingUser->is_active);

            if ($isPending && !$hasPaidOrders) {
                // Calon member yang belum menyelesaikan pembayaran / expired: izinkan daftar ulang dengan memperbarui data
                $existingUser->update([
                    'name'      => $name,
                    'phone'     => $phoneClean,
                    'password'  => $password,
                    'status'    => 'pending',
                    'is_active' => false,
                ]);
                $user = $existingUser;
            } else {
                return response()->json([
                    'error' => 'Email ini sudah terdaftar sebagai member aktif. Silakan login ke akun Anda untuk melanjutkan pembayaran atau mengelola langganan.'
                ], 422);
            }
        } else {
            $user = User::create([
                'name'      => $name,
                'email'     => $emailClean,
                'phone'     => $phoneClean,
                'password'  => $password,
                'is_active' => false,
                'status'    => 'pending',
            ]);
        }

        $planData = $plans[$plan];
        $orderId = 'HSR-REG-' . $user->id . '-' . strtoupper($plan) . '-' . round(microtime(true) * 1000);

        $subtotal = $planData['amount'];
        $discountAmount = 0;
        $appliedVoucher = null;

        $voucherCode = $request->input('voucher_code');
        if ($voucherCode) {
            $voucherResult = $this->validateVoucherLogic($voucherCode, $user->id, $plan, $planData['amount']);
            if ($voucherResult['valid']) {
                $subtotal = $voucherResult['final_amount'];
                $discountAmount = $voucherResult['discount'];
                $appliedVoucher = $voucherResult['voucher'];
            } else {
                return response()->json(['error' => 'Voucher: ' . $voucherResult['error']], 400);
            }
        }

        // Cancel previous pending orders for this user
        Order::where('user_id', $user->id)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        $customerName = $user->name ?: (explode('@', $user->email)[0] ?: 'Pelanggan');
        $baseUrl = $request->schemeAndHttpHost();

        try {
            $paymenkuRes = $this->paymenkuRequest('POST', '/transaction/create', [
                'reference_id'   => $orderId,
                'amount'         => $subtotal,
                'customer_name'  => $customerName,
                'customer_email' => $user->email,
                'customer_phone' => $user->phone ?: '08123456789',
                'channel_code'   => 'qris',
                'expiry_period'  => 10,
                'return_url'     => "{$baseUrl}/akun?paid={$orderId}",
            ]);
        } catch (Exception $e) {
            Log::error('[registerCheckout] Paymenku error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }

        $trx = $paymenkuRes['data'] ?? [];
        $trxId = $trx['trx_id'] ?? null;
        $grossAmount = (int) round((float) ($trx['amount'] ?? ($subtotal + ceil($subtotal * self::QRIS_FEE_PERCENT / 100) + self::QRIS_FEE_FIXED)));
        $adminFee = max(0, $grossAmount - $subtotal);
        $qrUrl = $trx['payment_info']['qr_url'] ?? null;
        $qrString = $trx['payment_info']['qr_string'] ?? null;

        $expStr = $trx['payment_info']['expiration_date'] ?? $trx['expiration_date'] ?? null;
        $parsedExp = now()->addMinutes(10);
        if ($expStr) {
            try {
                $gatewayExp = Carbon::parse($expStr);
                if ($gatewayExp->isBefore($parsedExp)) {
                    $parsedExp = $gatewayExp;
                }
            } catch (Exception) {}
        }

        // ── Affiliate Referral Attribution ──
        $refCode = trim((string) ($request->input('ref_code') ?? $request->input('affiliate_code') ?? ''));
        $referrer = null;
        $affiliateEnabled = Setting::get('affiliate_enabled', '1') !== '0';

        if ($refCode && $affiliateEnabled) {
            $foundReferrer = User::where('affiliate_code', strtoupper($refCode))
                ->where('is_affiliate', true)
                ->first();

            // Anti-fraud: prevent self-referral by ID, email, or phone
            if ($foundReferrer && $foundReferrer->id !== $user->id && strtolower($foundReferrer->email) !== $emailClean && $foundReferrer->phone !== $phoneClean) {
                $referrer = $foundReferrer;
                if (!$user->referred_by_id) {
                    $user->update(['referred_by_id' => $referrer->id]);
                }
            }
        } elseif ($user->referred_by_id && $affiliateEnabled) {
            $referrer = User::where('id', $user->referred_by_id)->where('is_affiliate', true)->first();
        }

        $commissionAmount = 0;
        if ($referrer) {
            // Commission strictly on first purchase only
            $hasPaidOrders = Order::where('user_id', $user->id)->where('status', 'paid')->exists();
            $hasEarnings = AffiliateEarning::where('referred_user_id', $user->id)->exists();
            if (!$hasPaidOrders && !$hasEarnings) {
                $nominalComm = (int) ($referrer->affiliate_commission ?? Setting::get('affiliate_commission_default', 20000));
                // Anti negative margin: commission cannot exceed order subtotal
                $commissionAmount = min($nominalComm, max(0, $subtotal));
            }
        }

        $order = Order::create([
            'user_id'           => $user->id,
            'email'             => $user->email,
            'order_id'          => $orderId,
            'plan'              => $plan,
            'amount'            => $grossAmount,
            'original_amount'   => $planData['amount'],
            'discount_amount'   => $discountAmount,
            'commission_amount' => $commissionAmount,
            'admin_fee'         => $adminFee,
            'duration_days'     => $planData['duration_days'],
            'status'            => 'pending',
            'payment_txn_id'    => $trxId,
            'qr_url'            => $qrUrl,
            'qr_string'         => $qrString,
            'voucher_code'      => $appliedVoucher?->code,
            'referred_by_id'    => $referrer?->id,
            'affiliate_code'    => $referrer?->affiliate_code,
            'expires_at'        => $parsedExp,
        ]);

        return response()->json([
            'order_id'        => $orderId,
            'plan'            => $plan,
            'plan_label'      => $planData['label'],
            'amount'          => $grossAmount,
            'subtotal'        => $subtotal,
            'admin_fee'       => $adminFee,
            'original_amount' => $planData['amount'],
            'discount_amount' => $discountAmount,
            'voucher_code'    => $appliedVoucher?->code,
            'duration_days'   => $planData['duration_days'],
            'qr_url'          => $qrUrl,
            'qr_string'       => $qrString,
            'expires_at'      => $parsedExp->toISOString(),
            'status'          => 'pending',
        ]);
    }

    /**
     * Check Public Registration Order Status (polling & auto-activate)
     */
    public function registerStatus(string $orderId, Request $request): JsonResponse
    {
        $order = Order::where('order_id', $orderId)->first();
        if (!$order) {
            return response()->json(['error' => 'Order tidak ditemukan'], 404);
        }

        $user = User::find($order->user_id);
        if (!$user) {
            return response()->json(['error' => 'User tidak ditemukan'], 404);
        }

        $matchedPlan = $this->getPlansConfig()[$order->plan] ?? null;
        $basePayload = [
            'order_id'        => $orderId,
            'status'          => $order->status,
            'plan'            => $order->plan,
            'plan_label'      => $matchedPlan['label'] ?? strtoupper($order->plan),
            'amount'          => (int) $order->amount,
            'subtotal'        => (int) ($order->subtotal ?? $order->amount),
            'admin_fee'       => (int) ($order->admin_fee ?? 0),
            'original_amount' => (int) ($matchedPlan['amount'] ?? $order->amount),
            'discount_amount' => (int) ($order->discount_amount ?? 0),
            'voucher_code'    => $order->voucher_code,
            'duration_days'   => $order->duration_days ?? ($matchedPlan['duration_days'] ?? 30),
            'qr_url'          => $order->qr_url,
            'qr_string'       => $order->qr_string,
            'expires_at'      => $order->expires_at?->toISOString(),
            'paid_at'         => $order->paid_at?->toISOString(),
            'customer_name'   => $user->name,
            'customer_email'  => $user->email,
        ];

        if ($order->status === 'paid') {
            $basePayload['status'] = 'paid';
            return response()->json($basePayload);
        }

        if (in_array($order->status, ['expired', 'failed', 'cancelled'])) {
            $basePayload['status'] = $order->status;
            return response()->json($basePayload);
        }

        // Auto expire if 10-min expiration has passed
        if ($order->expires_at && now()->isAfter($order->expires_at)) {
            $order->status = 'expired';
            $order->save();
            $basePayload['status'] = 'expired';
            return response()->json($basePayload);
        }

        // Check latest status with Paymenku
        try {
            $result = $this->paymenkuRequest('GET', "/check-status/{$orderId}");
            $pmStatus = $result['data'] ?? [];
            $rawStatus = $pmStatus['status'] ?? 'pending';

            $newStatus = match ($rawStatus) {
                'paid'    => 'paid',
                'failed'  => 'failed',
                'expired' => 'expired',
                default   => 'pending',
            };

            if ($newStatus === 'paid' && $order->status !== 'paid') {
                $this->activateUser($order, $pmStatus['paid_at'] ?? null);
                $freshOrder = $order->fresh();
                $basePayload['status'] = 'paid';
                $basePayload['paid_at'] = $freshOrder->paid_at?->toISOString() ?? now()->toISOString();
                return response()->json($basePayload);
            } elseif ($newStatus !== $order->status) {
                $order->status = $newStatus;
                $order->save();
            }

            $basePayload['status'] = $order->status;
            return response()->json($basePayload);
        } catch (Exception $e) {
            Log::warning("[registerStatus] Check status warning for {$orderId}: " . $e->getMessage());
            $basePayload['status'] = $order->status;
            return response()->json($basePayload);
        }
    }

    /**
     * Helper to activate user subscription
     */
    private function activateUser(Order $order, ?string $paidAtIso): void
    {
        DB::transaction(function () use ($order, $paidAtIso) {
            // SEC FIX (AUD2-HIGH-01): Lock order record with lockForUpdate to prevent concurrent double activation
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();
            if (!$lockedOrder || $lockedOrder->status === 'paid') {
                return; // Already processed by another concurrent request
            }

            $user = User::lockForUpdate()->find($lockedOrder->user_id);
            if (!$user) return;

            $now = now();
            $baseDate = ($user->expires_at && $user->expires_at->isFuture()) ? $user->expires_at : $now;
            $newExpiry = $baseDate->copy()->addDays($lockedOrder->duration_days);

            // Paymenku sends timestamp in WIB (Asia/Jakarta) without timezone offset.
            // Parse as Asia/Jakarta and convert to UTC to match Laravel application timestamps.
            $paidAt = $paidAtIso ? Carbon::parse($paidAtIso, 'Asia/Jakarta')->utc() : $now;

            $lockedOrder->update([
                'status'  => 'paid',
                'paid_at' => $paidAt,
            ]);

            $user->update([
                'is_active'  => true,
                'status'     => 'active',
                'expires_at' => $newExpiry,
            ]);

            // SEC-03: Record voucher usage only upon verified payment confirmation
            if ($lockedOrder->voucher_code) {
                $voucher = Voucher::where('code', $lockedOrder->voucher_code)->lockForUpdate()->first();
                if ($voucher) {
                    $alreadyRecorded = VoucherUsage::where('order_id', $lockedOrder->order_id)->exists();
                    if (!$alreadyRecorded) {
                        VoucherUsage::create([
                            'voucher_id'      => $voucher->id,
                            'user_id'         => $user->id,
                            'order_id'        => $lockedOrder->order_id,
                            'discount_amount' => $lockedOrder->discount_amount ?? 0,
                            'used_at'         => $paidAt,
                        ]);
                        $voucher->increment('used_count');
                    }
                }
            }

            // ── Settle Affiliate Commission (First purchase only) ──
            if ($lockedOrder->referred_by_id && $lockedOrder->commission_amount > 0) {
                $affiliateEnabled = Setting::get('affiliate_enabled', '1') !== '0';
                if ($affiliateEnabled) {
                    $alreadyCredited = AffiliateEarning::where('referred_user_id', $user->id)->exists();
                    if (!$alreadyCredited) {
                        $affiliateUser = User::where('id', $lockedOrder->referred_by_id)->lockForUpdate()->first();
                        if ($affiliateUser && $affiliateUser->is_affiliate && $affiliateUser->id !== $user->id) {
                            AffiliateEarning::create([
                                'affiliate_id'      => $affiliateUser->id,
                                'referred_user_id'  => $user->id,
                                'order_id'          => $lockedOrder->order_id,
                                'order_amount'      => (int) $lockedOrder->amount,
                                'commission_amount' => (int) $lockedOrder->commission_amount,
                                'status'            => 'available',
                            ]);

                            $affiliateUser->increment('affiliate_balance', $lockedOrder->commission_amount);

                            ActivityLog::create([
                                'user_id' => $affiliateUser->id,
                                'email'   => $affiliateUser->email,
                                'action'  => 'affiliate_commission_earned',
                                'detail'  => "Komisi Rp " . number_format($lockedOrder->commission_amount, 0, ',', '.') . " dari Order {$lockedOrder->order_id} (Member: {$user->name} / {$user->email})",
                            ]);
                        }
                    }
                }
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'email'   => $user->email,
                'action'  => 'payment_success',
                'detail'  => "Plan: {$lockedOrder->plan}, Amount: {$lockedOrder->amount}, Order: {$lockedOrder->order_id}",
            ]);
        });
    }

    /**
     * Public endpoint to validate an affiliate referral code
     */
    public function validateReferral(string $code): JsonResponse
    {
        $codeClean = trim(strtoupper($code));
        if (!$codeClean) {
            return response()->json(['valid' => false, 'message' => 'Kode referral tidak valid.'], 400);
        }

        $affiliateEnabled = Setting::get('affiliate_enabled', '1') !== '0';
        if (!$affiliateEnabled) {
            return response()->json(['valid' => false, 'message' => 'Program afiliasi sedang tidak aktif.'], 404);
        }

        $affiliate = User::where('affiliate_code', $codeClean)
            ->where('is_affiliate', true)
            ->first();

        if (!$affiliate) {
            return response()->json(['valid' => false, 'message' => 'Kode referral tidak ditemukan atau affiliator tidak aktif.'], 404);
        }

        // Mask referrer name for privacy (e.g. "Budi S***")
        $parts = explode(' ', trim($affiliate->name ?: 'Member'));
        $displayName = $parts[0];
        if (count($parts) > 1) {
            $displayName .= ' ' . substr($parts[1], 0, 1) . '***';
        }

        return response()->json([
            'valid'         => true,
            'code'          => $affiliate->affiliate_code,
            'referrer_name' => $displayName,
        ]);
    }
}
