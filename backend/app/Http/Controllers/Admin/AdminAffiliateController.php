<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AffiliateEarning;
use App\Models\AffiliatePayout;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminAffiliateController extends Controller
{
    /**
     * List all affiliates with statistics
     */
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status'); // 'all', 'active', 'inactive'

        $query = User::where(function ($q) {
            $q->where('is_affiliate', true)
              ->orWhereNotNull('affiliate_code');
        });

        if ($status === 'active') {
            $query->where('is_affiliate', true);
        } elseif ($status === 'inactive') {
            $query->where('is_affiliate', false);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('affiliate_code', 'like', "%{$search}%");
            });
        }

        $affiliates = $query->latest()->paginate(15);

        $affiliateIds = $affiliates->pluck('id');

        // Aggregate statistics in bulk for high performance
        $earningsSum = AffiliateEarning::whereIn('affiliate_id', $affiliateIds)
            ->where('status', '!=', 'cancelled')
            ->groupBy('affiliate_id')
            ->selectRaw('affiliate_id, SUM(commission_amount) as total_earned, COUNT(id) as paid_orders_count')
            ->pluck('total_earned', 'affiliate_id');

        $paidOrdersCount = AffiliateEarning::whereIn('affiliate_id', $affiliateIds)
            ->where('status', '!=', 'cancelled')
            ->groupBy('affiliate_id')
            ->selectRaw('affiliate_id, COUNT(id) as count')
            ->pluck('count', 'affiliate_id');

        $payoutsSum = AffiliatePayout::whereIn('affiliate_id', $affiliateIds)
            ->where('status', 'approved')
            ->groupBy('affiliate_id')
            ->selectRaw('affiliate_id, SUM(amount) as total_payout')
            ->pluck('total_payout', 'affiliate_id');

        $pendingPayoutsSum = AffiliatePayout::whereIn('affiliate_id', $affiliateIds)
            ->where('status', 'pending')
            ->groupBy('affiliate_id')
            ->selectRaw('affiliate_id, SUM(amount) as total_pending')
            ->pluck('total_pending', 'affiliate_id');

        $referralsCount = User::whereIn('referred_by_id', $affiliateIds)
            ->groupBy('referred_by_id')
            ->selectRaw('referred_by_id, COUNT(id) as count')
            ->pluck('count', 'referred_by_id');

        $defaultCommission = (int) Setting::get('affiliate_commission_default', 20000);

        $affiliates->getCollection()->transform(function ($u) use ($earningsSum, $paidOrdersCount, $payoutsSum, $pendingPayoutsSum, $referralsCount, $defaultCommission) {
            return [
                'id'                   => $u->id,
                'name'                 => $u->name,
                'email'                => $u->email,
                'phone'                => $u->phone,
                'is_affiliate'         => (bool) $u->is_affiliate,
                'affiliate_code'       => $u->affiliate_code,
                'commission_rate'      => (int) ($u->affiliate_commission ?? $defaultCommission),
                'custom_commission'    => $u->affiliate_commission,
                'affiliate_balance'    => (int) $u->affiliate_balance,
                'bank_name'            => $u->bank_name,
                'bank_account_number'  => $u->bank_account_number,
                'bank_account_holder'  => $u->bank_account_holder,
                'total_earned'         => (int) ($earningsSum[$u->id] ?? 0),
                'total_payout'         => (int) ($payoutsSum[$u->id] ?? 0),
                'pending_payout'       => (int) ($pendingPayoutsSum[$u->id] ?? 0),
                'referrals_count'      => (int) ($referralsCount[$u->id] ?? 0),
                'paid_orders_count'    => (int) ($paidOrdersCount[$u->id] ?? 0),
                'created_at'           => $u->created_at->toISOString(),
            ];
        });

        return response()->json($affiliates);
    }

    /**
     * Search users to appoint as affiliate (Autocomplete modal)
     */
    public function searchUsers(Request $request): JsonResponse
    {
        $q = trim((string) $request->input('q', ''));
        if ($q === '') {
            return response()->json([]);
        }

        $users = User::where(function ($query) use ($q) {
            $query->where('name', 'like', "%{$q}%")
                  ->orWhere('email', 'like', "%{$q}%")
                  ->orWhere('phone', 'like', "%{$q}%");
        })
        ->select('id', 'name', 'email', 'phone', 'is_affiliate', 'affiliate_code', 'affiliate_balance')
        ->limit(15)
        ->get();

        return response()->json($users);
    }

    /**
     * Appoint user as an affiliate
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'user_id'              => 'required|integer|exists:users,id',
            'affiliate_code'       => 'nullable|string|min:3|max:30|regex:/^[A-Za-z0-9_-]+$/|unique:users,affiliate_code',
            'affiliate_commission' => 'nullable|integer|min:0',
        ], [
            'user_id.required'           => 'Pilih user terlebih dahulu.',
            'user_id.exists'             => 'User tidak ditemukan.',
            'affiliate_code.unique'      => 'Kode referral ini sudah digunakan oleh user lain.',
            'affiliate_code.regex'       => 'Kode referral hanya boleh mengandung huruf, angka, dash (-), dan underscore (_).',
            'affiliate_commission.min'   => 'Nominal komisi tidak boleh negatif.',
        ]);

        $user = User::findOrFail($request->input('user_id'));

        $code = trim((string) $request->input('affiliate_code'));
        if ($code === '') {
            // Auto generate code: HS-XXXXXX
            do {
                $code = 'HS-' . strtoupper(Str::random(6));
            } while (User::where('affiliate_code', $code)->exists());
        } else {
            $code = strtoupper($code);
        }

        $commission = $request->filled('affiliate_commission') ? (int) $request->input('affiliate_commission') : null;

        $user->update([
            'is_affiliate'         => true,
            'affiliate_code'       => $code,
            'affiliate_commission' => $commission,
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'email'   => $user->email,
            'action'  => 'affiliate_appointed_by_admin',
            'detail'  => "Admin mengangkat member ini sebagai afiliator dengan kode [{$code}]",
        ]);

        return response()->json([
            'message'   => "User {$user->name} berhasil diangkat sebagai afiliator dengan kode {$code}!",
            'affiliate' => $user,
        ]);
    }

    /**
     * Update an affiliate's settings
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'affiliate_code'       => "required|string|min:3|max:30|regex:/^[A-Za-z0-9_-]+$/|unique:users,affiliate_code,{$id}",
            'affiliate_commission' => 'nullable|integer|min:0',
            'is_affiliate'         => 'required|boolean',
            'affiliate_balance'    => 'nullable|integer|min:0',
            'bank_name'            => 'nullable|string|max:50',
            'bank_account_number'  => 'nullable|string|max:50',
            'bank_account_holder'  => 'nullable|string|max:100',
        ], [
            'affiliate_code.unique' => 'Kode referral ini sudah digunakan.',
            'affiliate_code.regex'  => 'Kode referral hanya boleh mengandung huruf, angka, dash (-), dan underscore (_).',
        ]);

        $code = strtoupper(trim((string) $request->input('affiliate_code')));
        $commission = $request->filled('affiliate_commission') ? (int) $request->input('affiliate_commission') : null;

        $updateData = [
            'affiliate_code'       => $code,
            'affiliate_commission' => $commission,
            'is_affiliate'         => (bool) $request->input('is_affiliate'),
            'bank_name'            => $request->input('bank_name'),
            'bank_account_number'  => $request->input('bank_account_number'),
            'bank_account_holder'  => $request->input('bank_account_holder'),
        ];

        if ($request->has('affiliate_balance')) {
            $updateData['affiliate_balance'] = (int) $request->input('affiliate_balance');
        }

        $user->update($updateData);

        ActivityLog::create([
            'user_id' => $user->id,
            'email'   => $user->email,
            'action'  => 'affiliate_updated_by_admin',
            'detail'  => "Admin memperbarui data afiliasi [{$code}], status: " . ($user->is_affiliate ? 'Aktif' : 'Nonaktif'),
        ]);

        return response()->json([
            'message'   => 'Data afiliator berhasil diperbarui.',
            'affiliate' => $user,
        ]);
    }

    /**
     * Revoke / deactivate affiliate status
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->update(['is_affiliate' => false]);

        ActivityLog::create([
            'user_id' => $user->id,
            'email'   => $user->email,
            'action'  => 'affiliate_revoked_by_admin',
            'detail'  => "Admin menonaktifkan status afiliasi member {$user->name}",
        ]);

        return response()->json([
            'message' => "Status afiliator {$user->name} berhasil dinonaktifkan.",
        ]);
    }

    /**
     * List all payout requests (Queue)
     */
    public function payouts(Request $request): JsonResponse
    {
        $status = $request->input('status'); // 'all', 'pending', 'approved', 'rejected'
        $search = trim((string) $request->input('search', ''));

        $query = AffiliatePayout::with(['affiliate:id,name,email,phone', 'approvedBy:id,name']);

        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('payout_id', 'like', "%{$search}%")
                  ->orWhere('bank_account_number', 'like', "%{$search}%")
                  ->orWhere('bank_account_holder', 'like', "%{$search}%")
                  ->orWhereHas('affiliate', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('affiliate_code', 'like', "%{$search}%");
                  });
            });
        }

        $payouts = $query->latest()->paginate(15);

        return response()->json($payouts);
    }

    /**
     * Approve Payout Request (with optional transfer proof image upload)
     */
    public function approvePayout(Request $request, int $id): JsonResponse
    {
        $payout = AffiliatePayout::findOrFail($id);

        if ($payout->status !== 'pending') {
            return response()->json([
                'error' => "Permohonan penarikan ini sudah berstatus {$payout->status} dan tidak dapat diubah lagi.",
            ], 422);
        }

        $request->validate([
            'proof_image' => 'nullable|file|mimes:jpeg,png,jpg,webp|max:5120',
            'admin_notes' => 'nullable|string|max:500',
        ]);

        $proofPath = null;
        if ($request->hasFile('proof_image')) {
            $file = $request->file('proof_image');
            $filename = 'proof-' . $payout->payout_id . '-' . time() . '.' . $file->getClientOriginalExtension();
            $destDir = public_path('uploads/payout_proofs');
            if (!file_exists($destDir)) {
                mkdir($destDir, 0755, true);
            }
            $file->move($destDir, $filename);
            $proofPath = '/uploads/payout_proofs/' . $filename;
        }

        $admin = $request->user();

        $payout->update([
            'status'      => 'approved',
            'proof_image' => $proofPath ?: $payout->proof_image,
            'admin_notes' => $request->input('admin_notes') ?: $payout->admin_notes,
            'approved_by' => $admin?->id,
            'approved_at' => now(),
        ]);

        ActivityLog::create([
            'user_id' => $payout->affiliate_id,
            'email'   => $payout->affiliate?->email,
            'action'  => 'affiliate_payout_approved',
            'detail'  => "Admin menyetujui penarikan Rp " . number_format($payout->amount, 0, ',', '.') . " ({$payout->payout_id}) ke rekening {$payout->bank_name} {$payout->bank_account_number}",
        ]);

        return response()->json([
            'message' => 'Permohonan penarikan dana berhasil disetujui.',
            'payout'  => $payout->fresh()->load('affiliate:id,name,email'),
        ]);
    }

    /**
     * Reject Payout Request & Refund Balance
     */
    public function rejectPayout(Request $request, int $id): JsonResponse
    {
        $payout = AffiliatePayout::findOrFail($id);

        if ($payout->status !== 'pending') {
            return response()->json([
                'error' => "Permohonan penarikan ini sudah berstatus {$payout->status} dan tidak dapat diubah lagi.",
            ], 422);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ], [
            'reason.required' => 'Alasan penolakan wajib diisi untuk diinformasikan kepada afiliator.',
        ]);

        $reason = trim((string) $request->input('reason'));
        $admin = $request->user();

        return DB::transaction(function () use ($payout, $reason, $admin) {
            $lockedUser = User::where('id', $payout->affiliate_id)->lockForUpdate()->first();

            // Refund balance atomically
            if ($lockedUser) {
                $lockedUser->increment('affiliate_balance', $payout->amount);
            }

            $payout->update([
                'status'      => 'rejected',
                'admin_notes' => $reason,
                'approved_by' => $admin?->id,
                'approved_at' => now(),
            ]);

            ActivityLog::create([
                'user_id' => $payout->affiliate_id,
                'email'   => $lockedUser?->email,
                'action'  => 'affiliate_payout_rejected',
                'detail'  => "Admin menolak penarikan Rp " . number_format($payout->amount, 0, ',', '.') . " ({$payout->payout_id}). Alasan: {$reason}. Saldo dikembalikan.",
            ]);

            return response()->json([
                'message' => 'Permohonan penarikan dana ditolak dan saldo komisi telah dikembalikan ke akun afiliator.',
                'payout'  => $payout->fresh()->load('affiliate:id,name,email'),
            ]);
        });
    }

    /**
     * Global Commission Earnings Log
     */
    public function earnings(Request $request): JsonResponse
    {
        $search = trim((string) $request->input('search', ''));

        $query = AffiliateEarning::with([
            'affiliate:id,name,email,affiliate_code',
            'referredUser:id,name,email',
        ]);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                  ->orWhereHas('affiliate', function ($aq) use ($search) {
                      $aq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%")
                         ->orWhere('affiliate_code', 'like', "%{$search}%");
                  })
                  ->orWhereHas('referredUser', function ($rq) use ($search) {
                      $rq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $earnings = $query->latest()->paginate(20);

        return response()->json($earnings);
    }

    /**
     * Get Global Affiliate Settings
     */
    public function getSettings(): JsonResponse
    {
        return response()->json([
            'affiliate_enabled'            => Setting::get('affiliate_enabled', '1') !== '0',
            'affiliate_commission_default' => (int) Setting::get('affiliate_commission_default', 20000),
            'affiliate_min_payout'         => (int) Setting::get('affiliate_min_payout', 50000),
        ]);
    }

    /**
     * Update Global Affiliate Settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'affiliate_enabled'            => 'required|boolean',
            'affiliate_commission_default' => 'required|integer|min:0',
            'affiliate_min_payout'         => 'required|integer|min:1000',
        ]);

        Setting::set('affiliate_enabled', $request->boolean('affiliate_enabled') ? '1' : '0');
        Setting::set('affiliate_commission_default', (string) $request->input('affiliate_commission_default'));
        Setting::set('affiliate_min_payout', (string) $request->input('affiliate_min_payout'));

        return response()->json([
            'message'  => 'Pengaturan program afiliasi berhasil diperbarui.',
            'settings' => [
                'affiliate_enabled'            => $request->boolean('affiliate_enabled'),
                'affiliate_commission_default' => (int) $request->input('affiliate_commission_default'),
                'affiliate_min_payout'         => (int) $request->input('affiliate_min_payout'),
            ],
        ]);
    }
}
