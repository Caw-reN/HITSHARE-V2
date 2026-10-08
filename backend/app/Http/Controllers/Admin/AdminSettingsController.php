<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    /**
     * Get all settings
     */
    public function index(): JsonResponse
    {
        $settings = Setting::getAll();

        $isProd = ($settings['paymenku_is_production'] ?? 'false') === 'true';

        // Auto-seed sandbox / prod from legacy keys if not yet specifically set
        if (empty($settings['paymenku_sandbox_api_key']) && !empty($settings['paymenku_api_key'])) {
            if (!$isProd || str_starts_with($settings['paymenku_api_key'], 'sk_test_')) {
                $settings['paymenku_sandbox_api_key'] = $settings['paymenku_api_key'];
            }
        }
        if (empty($settings['paymenku_sandbox_webhook_secret']) && !empty($settings['paymenku_webhook_secret'])) {
            if (!$isProd || str_contains($settings['paymenku_webhook_secret'], 'test')) {
                $settings['paymenku_sandbox_webhook_secret'] = $settings['paymenku_webhook_secret'];
            }
        }
        if (empty($settings['paymenku_prod_api_key']) && !empty($settings['paymenku_api_key'])) {
            if ($isProd || str_starts_with($settings['paymenku_api_key'], 'sk_live_')) {
                $settings['paymenku_prod_api_key'] = $settings['paymenku_api_key'];
            }
        }
        if (empty($settings['paymenku_prod_webhook_secret']) && !empty($settings['paymenku_webhook_secret'])) {
            if ($isProd && !str_contains($settings['paymenku_webhook_secret'], 'test')) {
                $settings['paymenku_prod_webhook_secret'] = $settings['paymenku_webhook_secret'];
            }
        }

        // Mask helpers for UI badges
        $keysToMask = [
            'paymenku_api_key',
            'paymenku_sandbox_api_key',
            'paymenku_prod_api_key',
            'paymenku_webhook_secret',
            'paymenku_sandbox_webhook_secret',
            'paymenku_prod_webhook_secret',
        ];

        foreach ($keysToMask as $k) {
            if (!empty($settings[$k])) {
                $val = $settings[$k];
                if (str_contains($k, 'api_key')) {
                    $lastUnderscore = strrpos($val, '_');
                    $prefix = $lastUnderscore !== false ? substr($val, 0, $lastUnderscore + 1) : '';
                    $settings[$k . '_masked'] = strlen($val) > 12
                        ? $prefix . '••••••••' . substr($val, -4)
                        : '••••••••';
                } else {
                    $settings[$k . '_masked'] = strlen($val) > 8
                        ? substr($val, 0, 4) . '••••••••' . substr($val, -4)
                        : '••••••••';
                }
            }
        }

        return response()->json($settings);
    }

    /**
     * Update settings
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            // Ignore masked keys sent back
            if (str_ends_with($key, '_masked')) {
                continue;
            }

            // Do not overwrite existing secrets if submitted value contains mask dots
            if (in_array($key, [
                'paymenku_api_key', 'paymenku_webhook_secret',
                'paymenku_sandbox_api_key', 'paymenku_sandbox_webhook_secret',
                'paymenku_prod_api_key', 'paymenku_prod_webhook_secret'
            ])) {
                if (str_contains((string) $value, '••••')) {
                    continue;
                }
            }

            Setting::set($key, $value);
        }

        // Keep legacy keys synchronized with the active mode
        $isProd = ($data['paymenku_is_production'] ?? Setting::get('paymenku_is_production', 'false')) === 'true';

        if ($isProd) {
            $activeApiKey = $data['paymenku_prod_api_key'] ?? Setting::get('paymenku_prod_api_key', '');
            $activeWebhook = $data['paymenku_prod_webhook_secret'] ?? Setting::get('paymenku_prod_webhook_secret', '');
        } else {
            $activeApiKey = $data['paymenku_sandbox_api_key'] ?? Setting::get('paymenku_sandbox_api_key', '');
            $activeWebhook = $data['paymenku_sandbox_webhook_secret'] ?? Setting::get('paymenku_sandbox_webhook_secret', '');
        }

        if (!empty($activeApiKey) && !str_contains($activeApiKey, '••••')) {
            Setting::set('paymenku_api_key', $activeApiKey);
        }
        if (!empty($activeWebhook) && !str_contains($activeWebhook, '••••')) {
            Setting::set('paymenku_webhook_secret', $activeWebhook);
        }

        return response()->json(['message' => 'Pengaturan berhasil disimpan']);
    }
}
