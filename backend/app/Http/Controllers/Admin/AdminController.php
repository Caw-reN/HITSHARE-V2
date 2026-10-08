<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AffiliateEarning;
use App\Models\AffiliatePayout;
use App\Models\Category;
use App\Models\Order;
use App\Models\User;
use App\Models\Website;
use App\Models\WebsiteAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Dashboard Stats
     */
    public function dashboard(): JsonResponse
    {
        $staleThreshold = now()->subDays(7);
        $in7days = now()->addDays(7);
        $now = now();

        $totalCategories = Category::count();
        $totalWebsites = Website::count();
        $activeWebsites = Website::where('is_active', true)->count();

        // PERF FIX (AUD2-MED-02): Compute user stats directly in SQL instead of User::all() in memory
        $userCounts = User::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_count,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status = 'active' AND expires_at IS NOT NULL AND expires_at < ? THEN 1 ELSE 0 END) as expired_count,
            SUM(CASE WHEN status = 'active' AND (expires_at IS NULL OR expires_at >= ?) THEN 1 ELSE 0 END) as active_count
        ", [$now, $now])->first();

        $totalUsers    = (int) ($userCounts->total ?? 0);
        $activeUsers   = (int) ($userCounts->active_count ?? 0);
        $expiredUsers  = (int) ($userCounts->expired_count ?? 0);
        $inactiveUsers = (int) ($userCounts->inactive_count ?? 0);
        $pendingUsers  = (int) ($userCounts->pending_count ?? 0);

        $recentUsers = User::select('id', 'email', 'phone', 'is_active', 'status', 'expires_at', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($u) {
                return [
                    'id'         => $u->id,
                    'email'      => $u->email,
                    'phone'      => $u->phone,
                    'is_active'  => $u->is_active,
                    'status'     => $u->effectiveStatus(),
                    'expires_at' => $u->expires_at?->toISOString(),
                    'created_at' => $u->created_at?->toISOString(),
                ];
            });

        // Cookie health (based on accounts)
        $accounts = WebsiteAccount::where('is_active', true)->get();
        $cookieFresh = 0;
        $cookieStale = 0;
        $cookieEmpty = 0;

        foreach ($accounts as $acc) {
            $data = $acc->cookie_data;
            if (empty($data) || $data === '[]') {
                $cookieEmpty++;
            } elseif ($acc->cookie_updated_at && $acc->cookie_updated_at->gt($staleThreshold)) {
                $cookieFresh++;
            } else {
                $cookieStale++;
            }
        }

        $expiringIn7 = User::where('is_active', true)
            ->whereNotNull('expires_at')
            ->where('expires_at', '>', now())
            ->where('expires_at', '<=', $in7days)
            ->count();

        // PERF FIX (AUD2-MED-02): Calculate revenue using database aggregations instead of Order::all()
        $paidOrderStats = Order::where('status', 'paid')
            ->selectRaw("
                COUNT(*) as total_paid,
                COALESCE(SUM(amount), 0) as gross_revenue,
                COALESCE(SUM(admin_fee), 0) as total_fees,
                COALESCE(SUM(commission_amount), 0) as total_commissions,
                COALESCE(SUM(amount - COALESCE(admin_fee, 0) - COALESCE(commission_amount, 0)), 0) as net_revenue
            ")->first();

        $totalPaid         = (int) ($paidOrderStats->total_paid ?? 0);
        $totalGrossRevenue = (int) ($paidOrderStats->gross_revenue ?? 0);
        $totalFees         = (int) ($paidOrderStats->total_fees ?? 0);
        $totalCommissions  = (int) ($paidOrderStats->total_commissions ?? 0);
        $totalRevenue      = (int) ($paidOrderStats->net_revenue ?? 0);
        $totalPending      = Order::where('status', 'pending')->count();
        $todayCount        = Order::where('created_at', '>=', now()->startOfDay())->count();

        // Transaksi & Omset Hari Ini
        $todayOrderStats = Order::where('status', 'paid')
            ->where(function ($q) {
                $q->where('paid_at', '>=', now()->startOfDay())
                  ->orWhere(function ($q2) {
                      $q2->whereNull('paid_at')->where('created_at', '>=', now()->startOfDay());
                  });
            })
            ->selectRaw("
                COUNT(*) as today_paid,
                COALESCE(SUM(amount), 0) as today_gross,
                COALESCE(SUM(admin_fee), 0) as today_fees,
                COALESCE(SUM(commission_amount), 0) as today_commissions,
                COALESCE(SUM(amount - COALESCE(admin_fee, 0) - COALESCE(commission_amount, 0)), 0) as today_net
            ")->first();

        $todayPaidCount    = (int) ($todayOrderStats->today_paid ?? 0);
        $todayRevenue      = (int) ($todayOrderStats->today_net ?? 0);
        $todayGrossRevenue = (int) ($todayOrderStats->today_gross ?? 0);
        $todayFees         = (int) ($todayOrderStats->today_fees ?? 0);
        $todayCommissions  = (int) ($todayOrderStats->today_commissions ?? 0);

        // Transaksi & Omset Bulan Ini
        $monthOrderStats = Order::where('status', 'paid')
            ->where(function ($q) {
                $q->where('paid_at', '>=', now()->startOfMonth())
                  ->orWhere(function ($q2) {
                      $q2->whereNull('paid_at')->where('created_at', '>=', now()->startOfMonth());
                  });
            })
            ->selectRaw("
                COUNT(*) as month_paid,
                COALESCE(SUM(amount), 0) as month_gross,
                COALESCE(SUM(admin_fee), 0) as month_fees,
                COALESCE(SUM(commission_amount), 0) as month_commissions,
                COALESCE(SUM(amount - COALESCE(admin_fee, 0) - COALESCE(commission_amount, 0)), 0) as month_net
            ")->first();

        $monthPaidCount    = (int) ($monthOrderStats->month_paid ?? 0);
        $monthGrossRevenue = (int) ($monthOrderStats->month_gross ?? 0);
        $monthRevenue      = (int) ($monthOrderStats->month_net ?? 0);
        $monthFees         = (int) ($monthOrderStats->month_fees ?? 0);
        $monthCommissions  = (int) ($monthOrderStats->month_commissions ?? 0);

        // Nilai Rata-rata per Transaksi (AOV)
        $avgOrderValue = $totalPaid > 0 ? (int) round($totalRevenue / $totalPaid) : 0;

        // 5 Transaksi Terbaru
        $recentOrders = Order::select('id', 'order_id', 'email', 'plan', 'amount', 'status', 'created_at', 'paid_at')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($o) {
                return [
                    'id'         => $o->id,
                    'order_id'   => $o->order_id,
                    'email'      => $o->email,
                    'plan'       => $o->plan,
                    'amount'     => (int) $o->amount,
                    'status'     => $o->status,
                    'created_at' => $o->created_at?->toISOString(),
                    'paid_at'    => $o->paid_at?->toISOString(),
                ];
            });

        // Tren Penjualan 30 Hari Terakhir & 7 Hari Terakhir (Net Profit = amount - admin_fee - commission_amount)
        $last30Days = [];
        for ($i = 29; $i >= 0; $i--) {
            $dt = now()->subDays($i);
            $dateKey = $dt->format('Y-m-d');
            $last30Days[$dateKey] = [
                'date'    => $dateKey,
                'label'   => $dt->format('d M'),
                'revenue' => 0,
                'count'   => 0,
            ];
        }

        $dailyStats30 = Order::where('status', 'paid')
            ->where('created_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw("
                DATE(created_at) as date,
                COUNT(*) as count,
                COALESCE(SUM(amount - COALESCE(admin_fee, 0) - COALESCE(commission_amount, 0)), 0) as revenue
            ")
            ->groupBy('date')
            ->get();

        foreach ($dailyStats30 as $ds) {
            $k = (string) $ds->date;
            if (isset($last30Days[$k])) {
                $last30Days[$k]['revenue'] = (int) $ds->revenue;
                $last30Days[$k]['count']   = (int) $ds->count;
            }
        }
        $trendLast30Days = array_values($last30Days);
        $trendLast7Days  = array_slice($trendLast30Days, -7);

        // Distribusi Paket Terjual
        $planBreakdown = Order::where('status', 'paid')
            ->selectRaw("plan, COUNT(*) as count, COALESCE(SUM(amount), 0) as revenue")
            ->groupBy('plan')
            ->orderBy('count', 'desc')
            ->get();

        // Statistik Khusus Afiliasi
        $totalAffiliateEarnings  = (int) AffiliateEarning::where('status', '!=', 'cancelled')->sum('commission_amount');
        $totalAffiliatePayouts   = (int) AffiliatePayout::where('status', 'approved')->sum('amount');
        $pendingAffiliatePayouts = (int) AffiliatePayout::where('status', 'pending')->sum('amount');
        $pendingPayoutsCount     = (int) AffiliatePayout::where('status', 'pending')->count();
        $unpaidAffiliateBalance  = max(0, $totalAffiliateEarnings - $totalAffiliatePayouts);
        $activeAffiliatesCount   = User::where(function ($q) {
            $q->where('is_affiliate', true)->orWhereNotNull('affiliate_code');
        })->count();
        $todayAffiliateEarnings  = (int) AffiliateEarning::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', now()->startOfDay())
            ->sum('commission_amount');
        $monthAffiliateEarnings  = (int) AffiliateEarning::where('status', '!=', 'cancelled')
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('commission_amount');

        return response()->json([
            'totalUsers'      => $totalUsers,
            'activeUsers'     => $activeUsers,
            'expiredUsers'    => $expiredUsers,
            'inactiveUsers'   => $inactiveUsers,
            'pendingUsers'    => $pendingUsers,
            'totalCategories' => $totalCategories,
            'totalWebsites'   => $totalWebsites,
            'activeWebsites'  => $activeWebsites,
            'recentUsers'     => $recentUsers,
            'recentOrders'    => $recentOrders,
            'trendLast7Days'  => $trendLast7Days,
            'trendLast30Days' => $trendLast30Days,
            'planBreakdown'   => $planBreakdown,
            'cookieFresh'     => $cookieFresh,
            'cookieStale'     => $cookieStale,
            'cookieEmpty'     => $cookieEmpty,
            'expiringIn7'     => $expiringIn7,
            'ordersStats'     => [
                'totalRevenue'      => $totalRevenue,
                'totalGrossRevenue' => $totalGrossRevenue,
                'totalFees'         => $totalFees,
                'totalCommissions'  => $totalCommissions,
                'totalPaid'         => $totalPaid,
                'totalPending'      => $totalPending,
                'todayCount'        => $todayCount,
                'todayPaidCount'    => $todayPaidCount,
                'todayRevenue'      => $todayRevenue,
                'todayGrossRevenue' => $todayGrossRevenue,
                'todayFees'         => $todayFees,
                'todayCommissions'  => $todayCommissions,
                'monthPaidCount'    => $monthPaidCount,
                'monthRevenue'      => $monthRevenue,
                'monthGrossRevenue' => $monthGrossRevenue,
                'monthFees'         => $monthFees,
                'monthCommissions'  => $monthCommissions,
                'avgOrderValue'     => $avgOrderValue,
            ],
            'affiliateStats'  => [
                'totalEarnings'        => $totalAffiliateEarnings,
                'totalPaidPayouts'     => $totalAffiliatePayouts,
                'pendingPayoutsAmount' => $pendingAffiliatePayouts,
                'pendingPayoutsCount'  => $pendingPayoutsCount,
                'unpaidBalance'        => $unpaidAffiliateBalance,
                'activeAffiliates'     => $activeAffiliatesCount,
                'todayEarnings'        => $todayAffiliateEarnings,
                'monthEarnings'        => $monthAffiliateEarnings,
            ],
        ]);
    }

    /**
     * Activity Logs
     */
    public function logs(Request $request): JsonResponse
    {
        $page = max(1, (int) $request->input('page', 1));
        $limit = min(100, (int) $request->input('limit', 50));
        $search = trim($request->input('search', ''));

        $query = ActivityLog::orderBy('created_at', 'desc');

        if (!empty($search)) {
            $query->where('email', 'like', "%{$search}%");
        }

        $total = $query->count();
        $logs = $query->skip(($page - 1) * $limit)->take($limit)->get();

        return response()->json([
            'logs'  => $logs,
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
        ]);
    }
}
