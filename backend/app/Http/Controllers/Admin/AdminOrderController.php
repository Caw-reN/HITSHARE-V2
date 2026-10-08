<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AffiliateEarning;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherUsage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminOrderController extends Controller
{
    /**
     * List orders
     */
    public function index(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = min(100, (int) $request->input('limit', 30));
        $search = trim($request->input('search', ''));
        $status = trim($request->input('status', ''));

        $query = Order::with(['user:id,email,phone,name', 'referredBy:id,email,name', 'affiliateEarning'])
            ->orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('order_id', 'like', "%{$search}%");
            });
        }

        if (!empty($status) && in_array($status, ['pending', 'paid', 'expired', 'failed', 'cancelled'])) {
            $query->where('status', $status);
        }

        $total = $query->count();
        $orders = $query->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'orders' => $orders,
            'total'  => $total,
            'page'   => $page,
            'limit'  => $limit,
        ]);
    }

    /**
     * Show single order
     */
    public function show($id): JsonResponse
    {
        $query = Order::with(['user', 'referredBy', 'affiliateEarning']);
        $order = is_numeric($id) ? $query->find($id) : $query->where('order_id', $id)->first();
        if (!$order) {
            return response()->json(['error' => 'Order tidak ditemukan'], 404);
        }

        return response()->json($order);
    }

    /**
     * Manual Activate Order (by Admin)
     */
    public function manualActivate($id): JsonResponse
    {
        return DB::transaction(function () use ($id) {
            $orderQuery = Order::lockForUpdate();
            $order = is_numeric($id) ? $orderQuery->find($id) : $orderQuery->where('order_id', $id)->first();
            if (!$order) {
                return response()->json(['error' => 'Order tidak ditemukan'], 404);
            }

            // SEC FIX (AUD2-HIGH-03): Idempotency check - reject if order is already paid
            if ($order->status === 'paid') {
                return response()->json(['error' => 'Order ini sudah berstatus paid (sudah aktif)'], 422);
            }

            $user = User::lockForUpdate()->find($order->user_id);
            if (!$user) {
                return response()->json(['error' => 'User dari order ini tidak ditemukan'], 404);
            }

            $now = now();
            $baseDate = ($user->expires_at && $user->expires_at->isFuture()) ? $user->expires_at : $now;
            $newExpiry = $baseDate->copy()->addDays($order->duration_days);

            $order->status = 'paid';
            $order->paid_at = $now;
            $order->save();

            $user->is_active = true;
            $user->status = 'active';
            $user->expires_at = $newExpiry;
            $user->save();

            // Record voucher usage if applicable
            if ($order->voucher_code) {
                $voucher = Voucher::where('code', $order->voucher_code)->lockForUpdate()->first();
                if ($voucher) {
                    $alreadyRecorded = VoucherUsage::where('order_id', $order->order_id)->exists();
                    if (!$alreadyRecorded) {
                        VoucherUsage::create([
                            'voucher_id'      => $voucher->id,
                            'user_id'         => $user->id,
                            'order_id'        => $order->order_id,
                            'discount_amount' => $order->discount_amount ?? 0,
                            'used_at'         => $now,
                        ]);
                        $voucher->increment('used_count');
                    }
                }
            }

            // Settle Affiliate Commission (First purchase only, identical to PaymentController::activateUser)
            if ($order->referred_by_id && $order->commission_amount > 0) {
                $affiliateEnabled = Setting::get('affiliate_enabled', '1') !== '0';
                if ($affiliateEnabled) {
                    $alreadyCredited = AffiliateEarning::where('referred_user_id', $user->id)->exists();
                    if (!$alreadyCredited) {
                        $affiliateUser = User::where('id', $order->referred_by_id)->lockForUpdate()->first();
                        if ($affiliateUser && $affiliateUser->is_affiliate && $affiliateUser->id !== $user->id) {
                            AffiliateEarning::create([
                                'affiliate_id'      => $affiliateUser->id,
                                'referred_user_id'  => $user->id,
                                'order_id'          => $order->order_id,
                                'order_amount'      => (int) $order->amount,
                                'commission_amount' => (int) $order->commission_amount,
                                'status'            => 'available',
                            ]);

                            $affiliateUser->increment('affiliate_balance', $order->commission_amount);

                            ActivityLog::create([
                                'user_id' => $affiliateUser->id,
                                'email'   => $affiliateUser->email,
                                'action'  => 'affiliate_commission_earned',
                                'detail'  => "Komisi Rp " . number_format($order->commission_amount, 0, ',', '.') . " dari Order {$order->order_id} (Aktivasi Manual, Member: {$user->name} / {$user->email})",
                            ]);
                        }
                    }
                }
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'email'   => $user->email,
                'action'  => 'manual_activation',
                'detail'  => "Diaktivasi manual oleh admin. Order: {$order->order_id}, Duration: {$order->duration_days} hari",
            ]);

            return response()->json([
                'message'    => 'Order dan akun user berhasil diaktivasi secara manual',
                'expires_at' => $newExpiry->toISOString(),
                'order'      => $order,
            ]);
        });
    }
}
