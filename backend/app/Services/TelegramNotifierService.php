<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\WebsiteAccount;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class TelegramNotifierService
{
    protected const API_BASE = 'https://api.telegram.org/bot';

    protected Client $httpClient;

    public function __construct()
    {
        $this->httpClient = new Client([
            'timeout'          => 15,
            'connect_timeout'  => 8,
            'force_ip_resolve' => 'v4',
        ]);
    }

    /**
     * Ambil bot token dari database
     */
    public function getBotToken(): string
    {
        return trim(Setting::get('telegram_bot_token', ''));
    }

    /**
     * Ambil target chat id dari database
     */
    public function getChatId(): string
    {
        return trim(Setting::get('telegram_chat_id', ''));
    }

    /**
     * Cek apakah konfigurasi bot sudah lengkap
     */
    public function isConfigured(): bool
    {
        return !empty($this->getBotToken()) && !empty($this->getChatId());
    }

    /**
     * Cek apakah notifikasi diaktifkan oleh admin
     */
    public function isEnabled(): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        $val = Setting::get('telegram_notify_enabled', 'true');
        return $val === 'true' || $val === '1' || $val === true;
    }

    /**
     * Mengirim pesan teks HTML ke Telegram
     */
    public function sendMessage(string $htmlText, ?string $chatId = null, ?string $botToken = null): array
    {
        $token = $botToken ?: $this->getBotToken();
        $targetChat = $chatId ?: $this->getChatId();

        if (empty($token) || empty($targetChat)) {
            return [
                'success' => false,
                'error'   => 'Bot token atau Chat ID Telegram belum dikonfigurasi',
            ];
        }

        try {
            $url = self::API_BASE . $token . '/sendMessage';
            $response = $this->httpClient->post($url, [
                'json' => [
                    'chat_id'                  => $targetChat,
                    'text'                     => $htmlText,
                    'parse_mode'               => 'HTML',
                    'disable_web_page_preview' => true,
                ],
            ]);

            $body = json_decode((string) $response->getBody(), true);

            return [
                'success'    => true,
                'message_id' => $body['result']['message_id'] ?? null,
                'response'   => $body,
            ];
        } catch (\Exception $e) {
            $err = $this->extractErrorMessage($e);
            Log::error('Telegram notification error: ' . $err);

            return [
                'success' => false,
                'error'   => $err,
            ];
        }
    }

    /**
     * Mengirim pesan uji coba untuk memvalidasi token dan chat id
     */
    public function sendTestMessage(?string $botToken = null, ?string $chatId = null): array
    {
        $timeStr = now()->setTimezone('Asia/Jakarta')->translatedFormat('d M Y, H:i') . ' WIB';

        $text = "🔔 <b>[HITSHARE TEST ALERT]</b>\n\n"
              . "✅ <b>Koneksi Bot Telegram Berhasil Terhubung!</b>\n"
              . "Sistem HitShare siap mengirimkan peringatan otomatis secara instan apabila cookie akun terdeteksi logout atau kadaluarsa.\n\n"
              . "⏱ <i>Waktu Tes: {$timeStr}</i>\n"
              . "🌐 <i>Platform: HitShare Cloud Security</i>";

        return $this->sendMessage($text, $chatId, $botToken);
    }

    /**
     * Cek info bot (getMe)
     */
    public function getBotInfo(?string $botToken = null): array
    {
        $token = $botToken ?: $this->getBotToken();
        if (empty($token)) {
            return ['success' => false, 'error' => 'Bot token kosong'];
        }

        try {
            $url = self::API_BASE . $token . '/getMe';
            $res = $this->httpClient->get($url);
            $data = json_decode((string) $res->getBody(), true);

            if (!empty($data['ok'])) {
                return [
                    'success'  => true,
                    'bot'      => $data['result'],
                    'username' => $data['result']['username'] ?? null,
                    'name'     => $data['result']['first_name'] ?? null,
                ];
            }

            return ['success' => false, 'error' => 'Respon bot tidak valid'];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $this->extractErrorMessage($e)];
        }
    }

    /**
     * Daftarkan webhook Telegram
     */
    public function setWebhook(string $webhookUrl, ?string $botToken = null): array
    {
        $token = $botToken ?: $this->getBotToken();
        if (empty($token)) {
            return ['success' => false, 'error' => 'Bot token kosong'];
        }

        // Telegram API mewajibkan protokol HTTPS
        if (!str_starts_with(strtolower($webhookUrl), 'https://')) {
            return [
                'success' => false,
                'error'   => 'Telegram mewajibkan URL berprotokol HTTPS (dengan SSL) yang dapat diakses dari internet untuk fitur Webhook (perintah /status & /check). Di localhost, silakan gunakan tunnel HTTPS (seperti Ngrok) atau aktifkan fitur ini setelah website live di domain produksi. (Catatan: Notifikasi peringatan cookie tetap berjalan normal tanpa webhook).',
            ];
        }

        try {
            $url = self::API_BASE . $token . '/setWebhook';
            $res = $this->httpClient->post($url, [
                'json' => [
                    'url'             => $webhookUrl,
                    'allowed_updates' => ['message'],
                ],
            ]);
            $data = json_decode((string) $res->getBody(), true);

            return [
                'success'     => !empty($data['ok']),
                'description' => $data['description'] ?? 'Webhook diatur',
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $this->extractErrorMessage($e)];
        }
    }

    /**
     * Hapus webhook Telegram
     */
    public function deleteWebhook(?string $botToken = null): array
    {
        $token = $botToken ?: $this->getBotToken();
        if (empty($token)) {
            return ['success' => false, 'error' => 'Bot token kosong'];
        }

        try {
            $url = self::API_BASE . $token . '/deleteWebhook';
            $res = $this->httpClient->post($url);
            $data = json_decode((string) $res->getBody(), true);

            return ['success' => !empty($data['ok'])];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $this->extractErrorMessage($e)];
        }
    }

    /**
     * Ekstrak pesan error ramah dari Guzzle / Telegram API
     */
    protected function extractErrorMessage(\Exception $e): string
    {
        if ($e instanceof \GuzzleHttp\Exception\RequestException && $e->hasResponse()) {
            $body = (string) $e->getResponse()->getBody();
            $data = json_decode($body, true);
            if (!empty($data['description'])) {
                return $data['description'];
            }
        }

        // Sensor token bot agar tidak muncul di pesan error
        $msg = $e->getMessage();
        return preg_replace('/bot\d+:[a-zA-Z0-9_-]+/', 'bot[REDACTED]', $msg);
    }

    /**
     * Mengirim notifikasi peringatan spesifik untuk satu akun
     */
    public function sendCookieAlert(WebsiteAccount $account, bool $force = false): bool
    {
        if (!$this->isEnabled()) {
            return false;
        }

        $status = $account->cookie_status;
        if (!in_array($status, ['logged_out', 'expired', 'expiring_soon'], true)) {
            return false;
        }

        // Anti-spam / Cooldown: jangan kirim berulang-ulang untuk akun yang sama dalam 6 jam
        if (!$force && $account->last_notified_at && $account->last_notified_at->gt(now()->subHours(6))) {
            return false;
        }

        $websiteName = $account->website?->name ?? 'Website Layanan';
        $label = $account->label ?? 'Akun';
        $healthMsg = $account->health_message ?: 'Sesi terindikasi tidak valid';
        $timeStr = now()->setTimezone('Asia/Jakarta')->translatedFormat('d M Y, H:i') . ' WIB';

        if ($status === 'logged_out') {
            $icon = '🚨';
            $statusTitle = 'SESI TERPUTUS / LOGOUT';
            $actionHint = 'Akun terdeteksi logout dari sistem. Pengguna tidak dapat mengakses tools ini sebelum cookie diperbarui.';
        } elseif ($status === 'expired') {
            $icon = '⚠️';
            $statusTitle = 'COOKIE KADALUARSA';
            $actionHint = 'Masa berlaku cookie telah berakhir. Harap perbarui dengan array JSON cookie baru.';
        } else {
            $icon = '⏳';
            $statusTitle = 'SEGERA KADALUARSA (< 48 JAM)';
            $actionHint = 'Cookie masih aktif login, namun masa berlakunya akan segera habis.';
        }

        $text = "{$icon} <b>[HITSHARE ALERT] {$statusTitle}</b>\n\n"
              . "📌 <b>Layanan:</b> {$websiteName}\n"
              . "👤 <b>Label Akun:</b> {$label}\n"
              . "🔍 <b>Keterangan:</b> {$healthMsg}\n"
              . "⏱ <b>Waktu Deteksi:</b> {$timeStr}\n\n"
              . "💡 <i>{$actionHint}</i>\n\n"
              . "👉 <b>Buka Admin Dashboard:</b> Segera login ke dashboard untuk memperbarui cookie akun ini.";

        $res = $this->sendMessage($text);

        if ($res['success']) {
            $account->last_notified_at = now();
            $account->save();
            return true;
        }

        return false;
    }

    /**
     * Mengirim notifikasi rangkuman jika terdapat banyak akun yang bermasalah sekaligus
     */
    public function sendBatchSummaryAlert(array $criticalAccounts): bool
    {
        if (!$this->isEnabled() || empty($criticalAccounts)) {
            return false;
        }

        $count = count($criticalAccounts);
        $timeStr = now()->setTimezone('Asia/Jakarta')->translatedFormat('d M Y, H:i') . ' WIB';

        $text = "🚨 <b>[HITSHARE SYSTEM ALERT]</b>\n"
              . "Pemeriksaan otomatis mendeteksi <b>{$count} Akun Bermasalah</b> yang membutuhkan cookie baru:\n\n";

        $i = 1;
        foreach (array_slice($criticalAccounts, 0, 10) as $acc) {
            $wName = $acc['website_name'] ?? 'Website';
            $label = $acc['label'] ?? 'Akun';
            $st = $acc['status'] ?? 'unknown';
            $msg = $acc['health_message'] ?? '';

            $stBadge = $st === 'logged_out' ? '🔴 Logout' : ($st === 'expired' ? '🔴 Expired' : '🟡 Segera Habis');
            $text .= "{$i}. <b>{$wName}</b> ({$label})\n   {$stBadge}: <i>{$msg}</i>\n";
            $i++;
        }

        if ($count > 10) {
            $remaining = $count - 10;
            $text .= "\n<i>...dan {$remaining} akun bermasalah lainnya.</i>\n";
        }

        $text .= "\n⏱ <i>Waktu Deteksi: {$timeStr}</i>\n"
              . "👉 Harap segera periksa dan perbarui cookie pada <b>Admin Dashboard</b>.";

        $res = $this->sendMessage($text);
        return $res['success'];
    }

    /**
     * Menangani pesan interaktif (Two-Way Commands) yang masuk dari Telegram Webhook
     */
    public function handleWebhookUpdate(array $update): array
    {
        $message = $update['message'] ?? null;
        if (!$message) {
            return ['ok' => true, 'action' => 'ignored_no_message'];
        }

        $chatId = (string) ($message['chat']['id'] ?? '');
        $text = trim($message['text'] ?? '');
        $senderName = $message['from']['first_name'] ?? 'Admin';

        if (empty($text) || empty($chatId)) {
            return ['ok' => true, 'action' => 'empty_text'];
        }

        // 1. Command: /start atau /help atau /bantuan
        if (str_starts_with($text, '/start') || str_starts_with($text, '/help') || str_starts_with($text, '/bantuan')) {
            $reply = "👋 Halo <b>{$senderName}</b>! Selamat datang di <b>HitShare Security Bot</b>.\n\n"
                   . "Bot ini bertugas memantau status login dan masa kadaluarsa cookie seluruh akun website secara otomatis.\n\n"
                   . "<b>Perintah yang Tersedia:</b>\n"
                   . "📊 <code>/status</code> - Cek ringkasan kesehatan cookie saat ini\n"
                   . "⚡ <code>/check</code> - Jalankan pengecekan aktif status login seluruh akun sekarang\n"
                   . "🆔 <code>/myid</code> - Lihat Chat ID Telegram Anda (untuk konfigurasi)\n"
                   . "❓ <code>/help</code> - Tampilkan panduan ini\n\n"
                   . "🆔 <b>Chat ID Anda:</b> <code>{$chatId}</code>";

            $this->sendMessage($reply, $chatId);
            return ['ok' => true, 'action' => 'help_sent'];
        }

        // 2. Command: /myid
        if (str_starts_with($text, '/myid')) {
            $reply = "🆔 <b>Informasi Telegram Anda:</b>\n\n"
                   . "Chat ID: <code>{$chatId}</code>\n"
                   . "Nama: <b>{$senderName}</b>\n\n"
                   . "<i>Salin angka Chat ID di atas ke menu Pengaturan Admin Dashboard HitShare.</i>";

            $this->sendMessage($reply, $chatId);
            return ['ok' => true, 'action' => 'myid_sent'];
        }

        // 3. Command: /status
        if (str_starts_with($text, '/status')) {
            /** @var CookieVerifierService $verifier */
            $verifier = app(CookieVerifierService::class);
            $summary = $verifier->getSummary();

            $healthy = $summary['healthy'] ?? 0;
            $loggedOut = $summary['logged_out'] ?? 0;
            $expired = $summary['expired'] ?? 0;
            $expiringSoon = $summary['expiring_soon'] ?? 0;
            $empty = $summary['empty'] ?? 0;
            $total = $summary['total'] ?? 0;
            $critical = $summary['critical_accounts'] ?? [];

            $timeStr = now()->setTimezone('Asia/Jakarta')->translatedFormat('d M Y, H:i') . ' WIB';

            $reply = "📊 <b>[STATUS KESEHATAN COOKIE HITSHARE]</b>\n"
                   . "⏱ <i>{$timeStr}</i>\n\n"
                   . "🟢 <b>Login Aktif & Sehat:</b> {$healthy} Akun\n"
                   . "🔴 <b>Sesi Logout:</b> {$loggedOut} Akun\n"
                   . "🔴 <b>Kadaluarsa:</b> {$expired} Akun\n"
                   . "🟡 <b>Segera Habis (&lt;48j):</b> {$expiringSoon} Akun\n"
                   . "⚪ <b>Cookie Kosong:</b> {$empty} Akun\n"
                   . "━━━━━━━━━━━━━━━━━━\n"
                   . "📦 <b>Total Akun Aktif:</b> {$total} Akun\n\n";

            if (count($critical) > 0) {
                $reply .= "⚠️ <b>Daftar Akun yang Perlu Ditangani Segera:</b>\n";
                $i = 1;
                foreach (array_slice($critical, 0, 8) as $acc) {
                    $stBadge = $acc['status'] === 'logged_out' ? '🔴 Logout' : ($acc['status'] === 'expired' ? '🔴 Expired' : '🟡 Segera Habis');
                    $reply .= "{$i}. <b>{$acc['website_name']}</b> - {$acc['label']} ({$stBadge})\n   <i>{$acc['health_message']}</i>\n";
                    $i++;
                }
                if (count($critical) > 8) {
                    $sisa = count($critical) - 8;
                    $reply .= "<i>...dan {$sisa} akun lainnya.</i>\n";
                }
            } else {
                $reply .= "✨ <b>Luar biasa! Seluruh akun dalam kondisi normal dan masih login.</b>";
            }

            $this->sendMessage($reply, $chatId);
            return ['ok' => true, 'action' => 'status_sent'];
        }

        // 4. Command: /check
        if (str_starts_with($text, '/check')) {
            $this->sendMessage("⏳ <b>Memulai verifikasi aktif seluruh akun...</b>\nMohon tunggu beberapa detik, sistem sedang mengecek status login ke target website.", $chatId);

            /** @var CookieVerifierService $verifier */
            $verifier = app(CookieVerifierService::class);
            $stats = $verifier->verifyAllAccounts(true);
            $summary = $verifier->getSummary();

            $healthy = $stats['healthy'] ?? 0;
            $loggedOut = $stats['logged_out'] ?? 0;
            $expired = $stats['expired'] ?? 0;
            $expiringSoon = $stats['expiring_soon'] ?? 0;

            $issues = $loggedOut + $expired;
            $timeStr = now()->setTimezone('Asia/Jakarta')->translatedFormat('d M Y, H:i') . ' WIB';

            if ($issues > 0) {
                $resultText = "🚨 <b>[PEMERIKSAAN SELESAI - ADA MASALAH]</b>\n";
            } else {
                $resultText = "✅ <b>[PEMERIKSAAN SELESAI - SEMUA NORMAL]</b>\n";
            }

            $resultText .= "⏱ <i>{$timeStr}</i>\n\n"
                        . "🟢 <b>Login Normal:</b> {$healthy} akun\n"
                        . "🔴 <b>Terdeteksi Logout:</b> {$loggedOut} akun\n"
                        . "🔴 <b>Cookie Kadaluarsa:</b> {$expired} akun\n"
                        . "🟡 <b>Segera Habis:</b> {$expiringSoon} akun\n\n";

            if (!empty($summary['critical_accounts'])) {
                $resultText .= "⚠️ <b>Rincian Akun Bermasalah:</b>\n";
                $i = 1;
                foreach (array_slice($summary['critical_accounts'], 0, 6) as $acc) {
                    $resultText .= "{$i}. <b>{$acc['website_name']}</b> ({$acc['label']}): <i>{$acc['health_message']}</i>\n";
                    $i++;
                }
            }

            $this->sendMessage($resultText, $chatId);
            return ['ok' => true, 'action' => 'check_completed'];
        }

        // Perintah tidak dikenal
        $this->sendMessage(
            "❓ Perintah tidak dikenali. Ketik <code>/status</code> untuk cek kesehatan akun, <code>/check</code> untuk uji aktif, atau <code>/help</code> untuk bantuan.",
            $chatId
        );

        return ['ok' => true, 'action' => 'unknown_command'];
    }
}
