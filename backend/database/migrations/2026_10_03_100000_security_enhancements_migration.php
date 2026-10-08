<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Contracts\Encryption\DecryptException;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add device reset tracking to users table (SEC-08)
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'device_reset_count')) {
                $table->unsignedInteger('device_reset_count')->default(0)->after('device_id');
            }
            if (!Schema::hasColumn('users', 'last_device_reset_at')) {
                $table->timestamp('last_device_reset_at')->nullable()->after('device_reset_count');
            }
        });

        // 2. Encrypt all existing plaintext cookies in website_accounts (SEC-05)
        $accounts = DB::table('website_accounts')->select('id', 'cookie_data')->get();
        foreach ($accounts as $acc) {
            if (empty($acc->cookie_data)) continue;

            $isAlreadyEncrypted = false;
            try {
                Crypt::decryptString($acc->cookie_data);
                $isAlreadyEncrypted = true;
            } catch (DecryptException $e) {
                $isAlreadyEncrypted = false;
            }

            if (!$isAlreadyEncrypted) {
                DB::table('website_accounts')->where('id', $acc->id)->update([
                    'cookie_data' => Crypt::encryptString($acc->cookie_data)
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Decrypt cookies back to plaintext
        $accounts = DB::table('website_accounts')->select('id', 'cookie_data')->get();
        foreach ($accounts as $acc) {
            if (empty($acc->cookie_data)) continue;

            try {
                $decrypted = Crypt::decryptString($acc->cookie_data);
                DB::table('website_accounts')->where('id', $acc->id)->update([
                    'cookie_data' => $decrypted
                ]);
            } catch (DecryptException $e) {}
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'device_reset_count')) {
                $table->dropColumn('device_reset_count');
            }
            if (Schema::hasColumn('users', 'last_device_reset_at')) {
                $table->dropColumn('last_device_reset_at');
            }
        });
    }
};
