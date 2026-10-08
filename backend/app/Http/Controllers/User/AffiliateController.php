<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AffiliateEarning;
use App\Models\AffiliatePayout;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AffiliateController extends Controller
{
    /**
     * Affiliate Dashboard Overview
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $affiliateEnabled = Setting::get('affiliate_enabled', '1') !== '0';

        if (!$user->is_affiliate) {
            return response()->json([
                'is_affiliate'      => false,
                'affiliate_enabled' => $affiliateEnabled,
                'message'           => 'Anda belum terdaftar sebagai afiliator resmi Hitshare.',
            ]);
        }

        $commissionRate = (int) ($user->affiliate_commission ?? Setting::get('affiliate_commission_default', 20000));
        $minPayout = (int) Setting::get('affiliate_min_payout', 50000);

        $totalEarned = (int) AffiliateEarning::where('affiliate_id', $user->id)
            ->where('status', '!=', 'cancelled')
            ->sum('commission_amount');

        $totalWithdrawn = (int) AffiliatePayout::where('affiliate_id', $user->id)
            ->where('status', 'approved')
            ->sum('amount');

        $pendingWithdrawal = (int) AffiliatePayout::where('affiliate_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');

        $totalReferrals = User::where('referred_by_id', $user->id)->count();
        $paidReferrals = AffiliateEarning::where('affiliate_id', $user->id)
            ->where('status', '!=', 'cancelled')
            ->count();

        $hasPendingPayout = AffiliatePayout::where('affiliate_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        return response()->json([
            'is_affiliate'       => true,
            'affiliate_enabled'  => $affiliateEnabled,
            'affiliate_code'     => $user->affiliate_code,
            'affiliate_balance'  => (int) $user->affiliate_balance,
            'commission_rate'    => $commissionRate,
            'min_payout'         => $minPayout,
            'total_earned'       => $totalEarned,
            'total_withdrawn'    => $totalWithdrawn,
            'pending_withdrawal' => $pendingWithdrawal,
            'total_referrals'    => $totalReferrals,
            'paid_referrals'     => $paidReferrals,
            'has_pending_payout' => $hasPendingPayout,
            'bank_info'          => [
                'bank_name'           => $user->bank_name,
                'bank_account_number' => $user->bank_account_number,
                'bank_account_holder' => $user->bank_account_holder,
                'is_complete'         => !empty($user->bank_name) && !empty($user->bank_account_number) && !empty($user->bank_account_holder),
            ],
        ]);
    }

    /**
     * Update Bank Account details for payouts
     */
    public function updateBankAccount(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->is_affiliate) {
            return response()->json(['error' => 'Akses ditolak. Anda bukan afiliator.'], 403);
        }

        $request->validate([
            'bank_name'           => 'required|string|max:50',
            'bank_account_number' => 'required|string|max:50',
            'bank_account_holder' => 'required|string|max:100',
        ], [
            'bank_name.required'           => 'Nama bank / e-wallet wajib diisi.',
            'bank_account_number.required' => 'Nomor rekening / nomor e-wallet wajib diisi.',
            'bank_account_holder.required' => 'Nama pemilik rekening wajib diisi.',
        ]);

        $user->update([
            'bank_name'           => trim((string) $request->input('bank_name')),
            'bank_account_number' => trim((string) $request->input('bank_account_number')),
            'bank_account_holder' => trim((string) $request->input('bank_account_holder')),
        ]);

        return response()->json([
            'message'   => 'Informasi rekening bank berhasil disimpan.',
            'bank_info' => [
                'bank_name'           => $user->bank_name,
                'bank_account_number' => $user->bank_account_number,
                'bank_account_holder' => $user->bank_account_holder,
                'is_complete'         => true,
            ],
        ]);
    }

    /**
     * Request Commission Payout / Withdrawal
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->is_affiliate) {
            return response()->json(['error' => 'Akses ditolak. Anda bukan afiliator.'], 403);
        }

        if (empty($user->bank_name) || empty($user->bank_account_number) || empty($user->bank_account_holder)) {
            return response()->json([
                'error' => 'Lengkapi informasi rekening penarikan Anda terlebih dahulu sebelum mengajukan pencairan.',
            ], 422);
        }

        $minPayout = (int) Setting::get('affiliate_min_payout', 50000);

        $request->validate([
            'amount' => 'required|integer|min:' . $minPayout,
            'notes'  => 'nullable|string|max:500',
        ], [
            'amount.required' => 'Jumlah penarikan wajib diisi.',
            'amount.min'      => 'Minimal penarikan adalah Rp ' . number_format($minPayout, 0, ',', '.') . '.',
        ]);

        $amount = (int) $request->input('amount');

        // Check if there's already a pending payout request
        $hasPending = AffiliatePayout::where('affiliate_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return response()->json([
                'error' => 'Anda masih memiliki permohonan penarikan dana yang sedang diproses. Mohon tunggu verifikasi admin.',
            ], 422);
        }

        return DB::transaction(function () use ($user, $amount, $request) {
            $lockedUser = User::where('id', $user->id)->lockForUpdate()->first();

            if ($lockedUser->affiliate_balance < $amount) {
                return response()->json([
                    'error' => 'Saldo komisi Anda tidak mencukupi. Saldo tersedia: Rp ' . number_format($lockedUser->affiliate_balance, 0, ',', '.') . '.',
                ], 422);
            }

            // Deduct balance atomically
            $lockedUser->decrement('affiliate_balance', $amount);

            $payoutId = 'WD-' . date('ymd') . '-' . strtoupper(Str::random(5));

            $payout = AffiliatePayout::create([
                'payout_id'           => $payoutId,
                'affiliate_id'        => $lockedUser->id,
                'amount'              => $amount,
                'bank_name'           => $lockedUser->bank_name,
                'bank_account_number' => $lockedUser->bank_account_number,
                'bank_account_holder' => $lockedUser->bank_account_holder,
                'status'              => 'pending',
                'admin_notes'         => $request->input('notes'),
            ]);

            ActivityLog::create([
                'user_id' => $lockedUser->id,
                'email'   => $lockedUser->email,
                'action'  => 'affiliate_payout_requested',
                'detail'  => "Permohonan penarikan Rp " . number_format($amount, 0, ',', '.') . " ({$payoutId}) ke {$lockedUser->bank_name} {$lockedUser->bank_account_number}",
            ]);

            return response()->json([
                'message' => 'Permohonan penarikan berhasil diajukan! Admin akan memproses transfer Anda segera.',
                'payout'  => $payout,
                'balance' => (int) $lockedUser->fresh()->affiliate_balance,
            ]);
        });
    }

    /**
     * List Referred Users
     */
    public function referrals(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->is_affiliate) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $referrals = User::where('referred_by_id', $user->id)
            ->select('id', 'name', 'email', 'status', 'created_at')
            ->latest()
            ->paginate(15);

        $earnedBuyerIds = AffiliateEarning::where('affiliate_id', $user->id)
            ->where('status', '!=', 'cancelled')
            ->pluck('referred_user_id')
            ->flip();

        $referrals->getCollection()->transform(function ($ref) use ($earnedBuyerIds) {
            // Mask email for privacy (e.g. b***i@domain.com)
            $emailParts = explode('@', $ref->email);
            $local = $emailParts[0] ?? '';
            $domain = $emailParts[1] ?? '';
            $maskedLocal = strlen($local) > 2 ? substr($local, 0, 1) . '***' . substr($local, -1) : substr($local, 0, 1) . '***';

            return [
                'id'            => $ref->id,
                'name'          => $ref->name,
                'masked_email'  => $maskedLocal . '@' . $domain,
                'status'        => $ref->status,
                'has_purchased' => isset($earnedBuyerIds[$ref->id]),
                'registered_at' => $ref->created_at->toISOString(),
            ];
        });

        return response()->json($referrals);
    }

    /**
     * List Commission Earnings History
     */
    public function earnings(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->is_affiliate) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $earnings = AffiliateEarning::where('affiliate_id', $user->id)
            ->with(['referredUser:id,name,email'])
            ->latest()
            ->paginate(15);

        $earnings->getCollection()->transform(function ($earning) {
            $buyer = $earning->referredUser;
            $maskedEmail = '-';
            if ($buyer) {
                $parts = explode('@', $buyer->email);
                $maskedEmail = (strlen($parts[0]) > 2 ? substr($parts[0], 0, 1) . '***' . substr($parts[0], -1) : substr($parts[0], 0, 1) . '***') . '@' . ($parts[1] ?? '');
            }

            return [
                'id'                => $earning->id,
                'order_id'          => $earning->order_id,
                'buyer_name'        => $buyer?->name ?? 'Member',
                'buyer_email'       => $maskedEmail,
                'order_amount'      => (int) $earning->order_amount,
                'commission_amount' => (int) $earning->commission_amount,
                'status'            => $earning->status,
                'created_at'        => $earning->created_at->toISOString(),
            ];
        });

        return response()->json($earnings);
    }

    /**
     * List Payout Requests History
     */
    public function payouts(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->is_affiliate) {
            return response()->json(['error' => 'Akses ditolak.'], 403);
        }

        $payouts = AffiliatePayout::where('affiliate_id', $user->id)
            ->latest()
            ->paginate(15);

        return response()->json($payouts);
    }
}
