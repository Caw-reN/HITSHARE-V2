<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WebsiteClick;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    /**
     * User registration chart (last 30 days)
     */
    public function users(): JsonResponse
    {
        $since = now()->subDays(29)->startOfDay();

        $records = User::where('created_at', '>=', $since)
            ->select(DB::raw('DATE(created_at) as day'), DB::raw('count(*) as count'))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('count', 'day')
            ->toArray();

        $result = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $result[] = [
                'day'   => $date,
                'count' => $records[$date] ?? 0,
            ];
        }

        return response()->json($result);
    }

    /**
     * Top 10 website clicks
     */
    public function clicks(): JsonResponse
    {
        $clicks = WebsiteClick::select(
            'website_name',
            DB::raw('MAX(website_url) as website_url'),
            DB::raw('COUNT(*) as total_clicks'),
            DB::raw('MAX(clicked_at) as last_clicked')
        )
        ->groupBy('website_name')
        ->orderByDesc('total_clicks')
        ->limit(10)
        ->get();

        return response()->json($clicks);
    }

    /**
     * Daily clicks (last 14 days)
     */
    public function clicksDaily(): JsonResponse
    {
        $since = now()->subDays(13)->startOfDay();

        $records = WebsiteClick::where('clicked_at', '>=', $since)
            ->select(DB::raw('DATE(clicked_at) as day'), DB::raw('count(*) as count'))
            ->groupBy(DB::raw('DATE(clicked_at)'))
            ->pluck('count', 'day')
            ->toArray();

        $result = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $result[] = [
                'day'   => $date,
                'count' => $records[$date] ?? 0,
            ];
        }

        return response()->json($result);
    }
}
