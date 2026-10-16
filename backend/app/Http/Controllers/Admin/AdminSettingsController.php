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

    /**
     * Uji coba kirim pesan Telegram
     */
    public function testTelegram(Request $request, \App\Services\TelegramNotifierService $telegram): JsonResponse
    {
        $botToken = $request->input('bot_token');
        $chatId = $request->input('chat_id');

        $res = $telegram->sendTestMessage($botToken, $chatId);

        if ($res['success']) {
            return response()->json([
                'success' => true,
                'message' => 'Pesan uji coba berhasil terkirim ke Telegram!',
            ]);
        }

        return response()->json([
            'success' => false,
            'error'   => $res['error'] ?? 'Gagal mengirim pesan ke Telegram',
        ], 400);
    }

    /**
     * Cek status koneksi bot (getMe)
     */
    public function getTelegramBotInfo(Request $request, \App\Services\TelegramNotifierService $telegram): JsonResponse
    {
        $botToken = $request->input('bot_token');
        $res = $telegram->getBotInfo($botToken);

        if ($res['success']) {
            return response()->json([
                'success'  => true,
                'bot'      => $res['bot'] ?? null,
                'username' => $res['username'] ?? null,
                'name'     => $res['name'] ?? null,
            ]);
        }

        return response()->json([
            'success' => false,
            'error'   => $res['error'] ?? 'Gagal menghubungi bot Telegram',
        ], 400);
    }

    /**
     * Daftarkan webhook Telegram
     */
    public function setTelegramWebhook(Request $request, \App\Services\TelegramNotifierService $telegram): JsonResponse
    {
        $botToken = $request->input('bot_token');
        $customUrl = $request->input('webhook_url');

        // Gunakan URL webhook yang diinput admin atau fallback ke URL host saat ini
        $webhookUrl = $customUrl ?: url('/api/telegram/webhook');

        $res = $telegram->setWebhook($webhookUrl, $botToken);

        if ($res['success']) {
            return response()->json([
                'success'     => true,
                'webhook_url' => $webhookUrl,
                'message'     => 'Webhook Telegram berhasil didaftarkan ke ' . $webhookUrl,
            ]);
        }

        return response()->json([
            'success' => false,
            'error'   => $res['error'] ?? 'Gagal mendaftarkan webhook Telegram',
        ], 400);
    }
}

