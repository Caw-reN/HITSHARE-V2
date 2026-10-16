<?php

namespace App\Http\Controllers\Telegram;

use App\Http\Controllers\Controller;
use App\Services\TelegramNotifierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    /**
     * Endpoint penerima webhook Telegram (Two-Way Bot Commands: /status, /check, /myid, /help)
     */
    public function handle(Request $request, TelegramNotifierService $telegram): JsonResponse
    {
        $update = $request->all();

        try {
            $result = $telegram->handleWebhookUpdate($update);
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Telegram webhook handling failed: ' . $e->getMessage());
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 200);
        }
    }
}
