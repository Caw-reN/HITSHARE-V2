<?php

namespace App\Services;

use App\Models\WebsiteAccount;
use Carbon\Carbon;
use GuzzleHttp\Client;
use GuzzleHttp\Cookie\CookieJar;
use GuzzleHttp\Cookie\SetCookie;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class CookieVerifierService
{
    /**
     * User-Agent peramban modern untuk menghindari deteksi bot dasar
     */
    protected const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

    /**
     * Pola URL login yang menandakan sesi telah logout/invalid
     */
    protected const LOGIN_PATTERNS = [
        '/login',
        '/signin',
        '/sign-in',
        '/auth/login',
        '/masuk',
        '/session/new',
        '/ap/signin',
        '/id/login',
        'accounts.spotify.com',
        'accounts.google.com',
        'login.live.com',
    ];

    /**
     * Parse tanggal kadaluarsa terkecil dari array cookie
     */
    public function parseEarliestExpiration(?array $cookies): ?Carbon
    {
        if (empty($cookies) || !is_array($cookies)) {
            return null;
        }

        $minTimestamp = null;

        foreach ($cookies as $c) {
            if (!is_array($c)) {
                continue;
            }

            // Expiration timestamp di browser biasanya ada di 'expirationDate' atau 'expires'
            $ts = $c['expirationDate'] ?? $c['expires'] ?? null;
            if ($ts !== null && is_numeric($ts)) {
                $val = (int) $ts;
                // Filter nilai timestamp realistis (antara tahun 2020 hingga 2038)
                if ($val > 1577836800 && $val < 2147483647) {
                    if ($minTimestamp === null || $val < $minTimestamp) {
                        $minTimestamp = $val;
                    }
                }
            }
        }

        return $minTimestamp ? Carbon::createFromTimestamp($minTimestamp) : null;
    }

    /**
     * Verifikasi kesehatan & status login satu akun website
     */
    public function verifyAccount(WebsiteAccount $account, bool $probeHttp = true): array
    {
        $rawCookie = $account->cookie_data;

        // 1. Cek jika cookie kosong
        if (empty($rawCookie) || $rawCookie === '[]') {
            $account->cookie_status    = 'empty';
            $account->cookie_expires_at = null;
            $account->last_checked_at   = now();
            $account->health_message    = 'Data cookie belum diisi atau kosong';
            $account->save();

            return [
                'status'         => 'empty',
                'expires_at'     => null,
                'health_message' => $account->health_message,
            ];
        }

        // 2. Decode JSON cookie
        $cookies = json_decode($rawCookie, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($cookies)) {
            $account->cookie_status    = 'empty';
            $account->cookie_expires_at = null;
            $account->last_checked_at   = now();
            $account->health_message    = 'Format JSON cookie tidak valid';
            $account->save();

            return [
                'status'         => 'empty',
                'expires_at'     => null,
                'health_message' => $account->health_message,
            ];
        }

        // 3. Analisis tanggal kadaluarsa (Passive Expiry)
        $earliestExpires = $this->parseEarliestExpiration($cookies);

        // Jika tanggal kadaluarsa sudah lampau, langsung tandai EXPIRED tanpa perlu probe
        if ($earliestExpires && $earliestExpires->lte(now())) {
            $statusChanged = $account->cookie_status !== 'expired';
            $account->cookie_status    = 'expired';
            $account->cookie_expires_at = $earliestExpires;
            $account->last_checked_at   = now();
            $account->health_message    = 'Cookie telah kadaluarsa pada ' . $earliestExpires->format('d M Y H:i');
            $account->save();

            // Trigger notifikasi bot telegram
            try {
                app(\App\Services\TelegramNotifierService::class)->sendCookieAlert($account, $statusChanged);
            } catch (\Exception $e) {
                Log::warning('Gagal kirim alert telegram cookie: ' . $e->getMessage());
            }

            return [
                'status'         => 'expired',
                'expires_at'     => $earliestExpires->toISOString(),
                'health_message' => $account->health_message,
            ];
        }

        $website = $account->website;
        $websiteUrl = $website?->url ?: '';

        // 4. Active HTTP Session Probe (Cek apakah akun masih login)
        $probeResult = null;
        if ($probeHttp && !empty($websiteUrl)) {
            $probeResult = $this->executeHttpProbe($websiteUrl, $cookies);
        }

        // 5. Tentukan Status Akhir berdasarkan Probe & Expiration
        $finalStatus = 'healthy';
        $healthMsg = 'Sesi aktif & masih login';

        if ($probeResult) {
            if ($probeResult['is_logged_out']) {
                $finalStatus = 'logged_out';
                $healthMsg   = $probeResult['reason'] ?: 'Sesi terdeteksi logout / redirect ke halaman login';
            } elseif ($probeResult['is_verified']) {
                // Masih login, cek apakah masa aktif segera habis (< 48 jam)
                if ($earliestExpires && $earliestExpires->diffInHours(now()) <= 48) {
                    $finalStatus = 'expiring_soon';
                    $hoursLeft = max(1, (int) round($earliestExpires->diffInHours(now())));
                    $healthMsg   = "Masih login, namun cookie kadaluarsa dalam {$hoursLeft} jam";
                } else {
                    $finalStatus = 'healthy';
                    $healthMsg   = 'Sesi terverifikasi masih login (' . ($probeResult['http_code'] ?? 200) . ')';
                }
            } else {
                // Probe bot-blocked (Cloudflare captcha dll), fallback ke expiration date
                if ($earliestExpires && $earliestExpires->diffInHours(now()) <= 48) {
                    $finalStatus = 'expiring_soon';
                    $hoursLeft = max(1, (int) round($earliestExpires->diffInHours(now())));
                    $healthMsg   = "Cookie kadaluarsa dalam {$hoursLeft} jam (Verifikasi masa berlaku)";
                } else {
                    $finalStatus = 'healthy';
                    $healthMsg   = 'Sesi aktif berdasarkan tanggal masa berlaku cookie';
                }
            }
        } else {
            // Tanpa HTTP probe (atau probe dinonaktifkan)
            if ($earliestExpires && $earliestExpires->diffInHours(now()) <= 48) {
                $finalStatus = 'expiring_soon';
                $hoursLeft = max(1, (int) round($earliestExpires->diffInHours(now())));
                $healthMsg   = "Cookie kadaluarsa dalam {$hoursLeft} jam";
            } else {
                $finalStatus = 'healthy';
                $healthMsg   = 'Sesi aktif terverifikasi';
            }
        }

        $prevStatus = $account->cookie_status;

        // Simpan ke database
        $account->cookie_status    = $finalStatus;
        $account->cookie_expires_at = $earliestExpires;
        $account->last_checked_at   = now();
        $account->health_message    = $healthMsg;
        $account->save();

        // Trigger notifikasi bot telegram jika berstatus kritis
        if (in_array($finalStatus, ['logged_out', 'expired', 'expiring_soon'], true)) {
            $statusChanged = $prevStatus !== $finalStatus;
            try {
                app(\App\Services\TelegramNotifierService::class)->sendCookieAlert($account, $statusChanged);
            } catch (\Exception $e) {
                Log::warning('Gagal kirim alert telegram cookie: ' . $e->getMessage());
            }
        }

        return [
            'status'         => $finalStatus,
            'expires_at'     => $earliestExpires?->toISOString(),
            'last_checked_at'=> $account->last_checked_at->toISOString(),
            'health_message' => $healthMsg,
        ];
    }

    /**
     * Mengirim request HTTP dengan CookieJar untuk mendeteksi apakah session masih login
     */
    protected function executeHttpProbe(string $targetUrl, array $cookies): array
    {
        try {
            $parsedUrl = parse_url($targetUrl);
            $domain = $parsedUrl['host'] ?? '';
            if (empty($domain)) {
                return ['is_logged_out' => false, 'is_verified' => false, 'reason' => null];
            }

            // Tentukan endpoint check spesifik berdasarkan domain website
            $testUrl = $targetUrl;
            if (str_contains($domain, 'netflix.com')) {
                $testUrl = 'https://www.netflix.com/youraccount';
            } elseif (str_contains($domain, 'chatgpt.com') || str_contains($domain, 'openai.com')) {
                $testUrl = 'https://chatgpt.com/api/auth/session';
            } elseif (str_contains($domain, 'canva.com')) {
                $testUrl = 'https://www.canva.com/home';
            } elseif (str_contains($domain, 'primevideo.com')) {
                $testUrl = 'https://www.primevideo.com';
            } elseif (str_contains($domain, 'spotify.com')) {
                $testUrl = 'https://open.spotify.com';
            }

            // Bangun CookieJar
            $jar = new CookieJar();
            foreach ($cookies as $c) {
                if (empty($c['name'])) continue;
                $rawDomain = ltrim($c['domain'] ?? '', '.');
                $cookieDomain = $rawDomain ?: $domain;

                $jar->setCookie(new SetCookie([
                    'Name'     => $c['name'],
                    'Value'    => $c['value'] ?? '',
                    'Domain'   => $cookieDomain,
                    'Path'     => $c['path'] ?? '/',
                    'Secure'   => !empty($c['secure']),
                    'HttpOnly' => !empty($c['httpOnly']),
                    'Expires'  => !empty($c['expirationDate']) ? (int) $c['expirationDate'] : null,
                ]));
            }

            $client = new Client([
                'cookies'          => $jar,
                'timeout'          => 6,
                'connect_timeout'  => 4,
                'force_ip_resolve' => 'v4',
                'allow_redirects'  => [
                    'max'             => 5,
                    'track_redirects' => true,
                ],
                'headers'         => [
                    'User-Agent'      => self::USER_AGENT,
                    'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'DNT'             => '1',
                ],
            ]);

            $response = $client->request('GET', $testUrl);
            $statusCode = $response->getStatusCode();

            // Dapatkan URL akhir setelah pengalihan (redirect)
            $redirectHistory = $response->getHeader('X-Guzzle-Redirect-History');
            $finalUrl = !empty($redirectHistory) ? end($redirectHistory) : $testUrl;

            // 1. Cek apakah diarahkan ke halaman login
            foreach (self::LOGIN_PATTERNS as $pattern) {
                if (str_contains(strtolower($finalUrl), $pattern)) {
                    return [
                        'is_logged_out' => true,
                        'is_verified'   => true,
                        'http_code'     => $statusCode,
                        'reason'        => 'Terdeteksi logout (Dialihkan ke halaman login: ' . parse_url($finalUrl, PHP_URL_PATH) . ')',
                    ];
                }
            }

            // 2. Kasus khusus: API Session ChatGPT
            if (str_contains($testUrl, 'chatgpt.com/api/auth/session')) {
                $body = (string) $response->getBody();
                $json = json_decode($body, true);
                if (empty($json) || empty($json['user'])) {
                    return [
                        'is_logged_out' => true,
                        'is_verified'   => true,
                        'http_code'     => $statusCode,
                        'reason'        => 'Sesi ChatGPT tidak aktif (Auth session kosong)',
                    ];
                }
            }

            // 3. Status 200 normal
            if ($statusCode >= 200 && $statusCode < 300) {
                return [
                    'is_logged_out' => false,
                    'is_verified'   => true,
                    'http_code'     => $statusCode,
                    'reason'        => null,
                ];
            }

            return [
                'is_logged_out' => false,
                'is_verified'   => false,
                'http_code'     => $statusCode,
                'reason'        => null,
            ];

        } catch (GuzzleException $e) {
            $code = $e->getCode();
            // Jika status 401 Unauthorized -> Sesi pasti logout
            if ($code === 401) {
                return [
                    'is_logged_out' => true,
                    'is_verified'   => true,
                    'http_code'     => 401,
                    'reason'        => 'Akses ditolak: 401 Unauthorized (Sesi Login Mati)',
                ];
            }

            // Jika status 403 (mungkin Cloudflare shield) atau timeout koneksi
            Log::info("Cookie probe note for {$targetUrl}: " . $e->getMessage());

            return [
                'is_logged_out' => false,
                'is_verified'   => false,
                'http_code'     => $code ?: 0,
                'reason'        => null,
            ];
        } catch (\Throwable $e) {
            Log::warning("Cookie probe exception for {$targetUrl}: " . $e->getMessage());
            return [
                'is_logged_out' => false,
                'is_verified'   => false,
                'http_code'     => 0,
                'reason'        => null,
            ];
        }
    }

    /**
     * Memindai seluruh akun website yang aktif
     */
    public function verifyAllAccounts(bool $probeHttp = true): array
    {
        $accounts = WebsiteAccount::where('is_active', true)->with('website')->get();

        $stats = [
            'total'         => $accounts->count(),
            'healthy'       => 0,
            'expiring_soon' => 0,
            'logged_out'    => 0,
            'expired'       => 0,
            'empty'         => 0,
            'checked_at'    => now()->toISOString(),
        ];

        foreach ($accounts as $acc) {
            $res = $this->verifyAccount($acc, $probeHttp);
            $st = $res['status'] ?? 'empty';
            if (isset($stats[$st])) {
                $stats[$st]++;
            }
        }

        return $stats;
    }

    /**
     * Mengambil ringkasan kesehatan cookie dari database untuk Admin Dashboard
     */
    public function getSummary(): array
    {
        $accounts = WebsiteAccount::where('is_active', true)
            ->with(['website:id,name,icon'])
            ->get();

        $stats = [
            'total'         => $accounts->count(),
            'healthy'       => 0,
            'expiring_soon' => 0,
            'logged_out'    => 0,
            'expired'       => 0,
            'empty'         => 0,
            'critical_accounts' => [],
        ];

        foreach ($accounts as $acc) {
            $st = $acc->cookie_status ?: 'empty';
            if (isset($stats[$st])) {
                $stats[$st]++;
            }

            // Akun yang butuh perhatian admin (merah / kuning)
            if (in_array($st, ['logged_out', 'expired', 'expiring_soon'], true)) {
                $stats['critical_accounts'][] = [
                    'id'             => $acc->id,
                    'website_id'     => $acc->website_id,
                    'website_name'   => $acc->website?->name ?? 'Website',
                    'website_icon'   => $acc->website?->icon ?? '',
                    'label'          => $acc->label,
                    'status'         => $st,
                    'health_message' => $acc->health_message,
                    'expires_at'     => $acc->cookie_expires_at?->toISOString(),
                    'last_checked_at'=> $acc->last_checked_at?->toISOString(),
                ];
            }
        }

        return $stats;
    }
}
