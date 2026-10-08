<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Website;
use App\Models\WebsiteAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWebsiteController extends Controller
{
    /**
     * List all websites
     */
    public function index(): JsonResponse
    {
        $websites = Website::with(['category', 'accounts'])->orderBy('name')->get();

        $result = $websites->map(function ($w) {
            return [
                'id'            => $w->id,
                'category_id'   => $w->category_id,
                'category_name' => $w->category?->name ?? '',
                'name'          => $w->name,
                'icon'          => $w->icon,
                'url'           => $w->url,
                'is_active'     => (bool) $w->is_active,
                'account_count' => $w->accounts->count(),
                'accounts'      => $w->accounts->map(function ($acc) {
                    return [
                        'id'                => $acc->id,
                        'website_id'        => $acc->website_id,
                        'label'             => $acc->label,
                        'cookie_data'       => $acc->cookie_data,
                        'cookie_bytes'      => strlen($acc->cookie_data ?? ''),
                        'cookie_updated_at' => $acc->cookie_updated_at?->toISOString(),
                        'is_active'         => (bool) $acc->is_active,
                        'created_at'        => $acc->created_at?->toISOString(),
                        'updated_at'        => $acc->updated_at?->toISOString(),
                    ];
                }),
                'created_at'    => $w->created_at?->toISOString(),
                'updated_at'    => $w->updated_at?->toISOString(),
            ];
        });

        return response()->json($result);
    }

    /**
     * Create website
     */
    public function store(Request $request): JsonResponse
    {
        $categoryId = $request->input('category_id');
        $name = trim($request->input('name', ''));
        $icon = $request->input('icon', '');
        $url = $request->input('url', '');
        $isActive = $request->boolean('is_active', true);

        if (!$categoryId || !$name) {
            return response()->json(['error' => 'Kategori dan nama harus diisi'], 400);
        }

        $website = Website::create([
            'category_id' => $categoryId,
            'name'        => $name,
            'icon'        => $icon,
            'url'         => $url,
            'is_active'   => $isActive,
        ]);

        return response()->json([
            'id'      => $website->id,
            'message' => 'Website berhasil ditambahkan',
        ]);
    }

    /**
     * Update website
     */
    public function update($id, Request $request): JsonResponse
    {
        $website = Website::find($id);
        if (!$website) {
            return response()->json(['error' => 'Website tidak ditemukan'], 404);
        }

        if ($request->has('category_id')) {
            $website->category_id = $request->input('category_id');
        }
        if ($request->has('name')) {
            $website->name = trim($request->input('name'));
        }
        if ($request->has('icon')) {
            $website->icon = $request->input('icon');
        }
        if ($request->has('url')) {
            $website->url = $request->input('url');
        }
        if ($request->has('is_active')) {
            $website->is_active = $request->boolean('is_active');
        }

        $website->save();

        return response()->json(['message' => 'Website berhasil diperbarui']);
    }

    /**
     * Delete website
     */
    public function destroy($id): JsonResponse
    {
        $website = Website::find($id);
        if (!$website) {
            return response()->json(['error' => 'Website tidak ditemukan'], 404);
        }

        $website->delete();

        return response()->json(['message' => 'Website berhasil dihapus']);
    }

    /**
     * List accounts for a website
     */
    public function accounts($id): JsonResponse
    {
        $accounts = WebsiteAccount::where('website_id', $id)
            ->orderBy('created_at')
            ->get();

        return response()->json($accounts);
    }

    /**
     * Add account to website
     */
    public function addAccount($id, Request $request): JsonResponse
    {
        $website = Website::find($id);
        if (!$website) {
            return response()->json(['error' => 'Website tidak ditemukan'], 404);
        }

        $label = trim($request->input('label', ''));
        $cookieData = $request->input('cookie_data');
        $isActive = $request->boolean('is_active', true);

        if (!$label) {
            return response()->json(['error' => 'Label akun harus diisi'], 400);
        }

        if ($cookieData) {
            json_decode($cookieData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['error' => 'Cookie data bukan JSON yang valid'], 400);
            }
        }

        $hasCookie = !empty($cookieData) && $cookieData !== '[]';

        $account = WebsiteAccount::create([
            'website_id'        => $website->id,
            'label'             => $label,
            'cookie_data'       => $cookieData ?: '[]',
            'cookie_updated_at' => $hasCookie ? now() : null,
            'is_active'         => $isActive,
        ]);

        return response()->json([
            'id'      => $account->id,
            'message' => 'Akun berhasil ditambahkan',
        ]);
    }

    /**
     * Update account
     */
    public function updateAccount($id, $accId, Request $request): JsonResponse
    {
        $account = WebsiteAccount::where('website_id', $id)->where('id', $accId)->first();
        if (!$account) {
            return response()->json(['error' => 'Akun tidak ditemukan'], 404);
        }

        $cookieData = $request->input('cookie_data');
        if ($cookieData) {
            json_decode($cookieData);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['error' => 'Cookie data bukan JSON yang valid'], 400);
            }
        }

        $cookieChanged = $request->has('cookie_data') && $account->cookie_data !== $cookieData;

        if ($request->has('label')) {
            $account->label = trim($request->input('label'));
        }
        if ($request->has('cookie_data')) {
            $account->cookie_data = $cookieData ?: '[]';
        }
        if ($request->has('is_active')) {
            $account->is_active = $request->boolean('is_active');
        }
        if ($cookieChanged) {
            $account->cookie_updated_at = now();
        }

        $account->save();

        return response()->json(['message' => 'Akun berhasil diperbarui']);
    }

    /**
     * Delete account
     */
    public function destroyAccount($id, $accId): JsonResponse
    {
        $account = WebsiteAccount::where('website_id', $id)->where('id', $accId)->first();
        if (!$account) {
            return response()->json(['error' => 'Akun tidak ditemukan'], 404);
        }

        $account->delete();

        return response()->json(['message' => 'Akun berhasil dihapus']);
    }
}
