<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // 1. Tambah kolom afiliasi pada tabel users
        Schema::table('users', function (Blueprint $table) {
            $table->string('affiliate_code', 32)->nullable()->unique()->after('email');
            $table->foreignId('referred_by_id')->nullable()->after('affiliate_code')->constrained('users')->nullOnDelete();
            $table->boolean('is_affiliate')->default(false)->after('referred_by_id');
            $table->integer('affiliate_commission')->nullable()->after('is_affiliate'); // null = gunakan default setting
            $table->integer('affiliate_balance')->default(0)->after('affiliate_commission');
            $table->string('bank_name', 50)->nullable()->after('affiliate_balance');
            $table->string('bank_account_number', 50)->nullable()->after('bank_name');
            $table->string('bank_account_holder', 100)->nullable()->after('bank_account_number');

            $table->index('is_affiliate');
        });

        // 2. Tambah kolom afiliasi pada tabel orders
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('referred_by_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            $table->string('affiliate_code', 32)->nullable()->after('referred_by_id');
            $table->integer('commission_amount')->default(0)->after('discount_amount');

            $table->index('affiliate_code');
        });

        // 3. Tabel pencatatan komisi afiliasi (affiliate_earnings)
        Schema::create('affiliate_earnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('referred_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('order_id', 64)->index();
            $table->integer('order_amount');
            $table->integer('commission_amount');
            $table->enum('status', ['available', 'withdrawn', 'cancelled'])->default('available');
            $table->timestamps();

            $table->index(['affiliate_id', 'status']);
        });

        // 4. Tabel permohonan penarikan dana afiliasi (affiliate_payouts)
        Schema::create('affiliate_payouts', function (Blueprint $table) {
            $table->id();
            $table->string('payout_id', 32)->unique();
            $table->foreignId('affiliate_id')->constrained('users')->cascadeOnDelete();
            $table->integer('amount');
            $table->string('bank_name', 50);
            $table->string('bank_account_number', 50);
            $table->string('bank_account_holder', 100);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->string('proof_image', 255)->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('admins')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index(['affiliate_id', 'status']);
        });

        // 5. Inisialisasi default settings untuk afiliasi jika belum ada
        $defaultSettings = [
            'affiliate_enabled'            => '1',
            'affiliate_commission_default' => '20000',
            'affiliate_min_payout'         => '50000',
        ];

        foreach ($defaultSettings as $key => $val) {
            if (!DB::table('settings')->where('key', $key)->exists()) {
                DB::table('settings')->insert(['key' => $key, 'value' => $val]);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_payouts');
        Schema::dropIfExists('affiliate_earnings');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['referred_by_id']);
            $table->dropColumn(['referred_by_id', 'affiliate_code', 'commission_amount']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['referred_by_id']);
            $table->dropColumn([
                'affiliate_code',
                'referred_by_id',
                'is_affiliate',
                'affiliate_commission',
                'affiliate_balance',
                'bank_name',
                'bank_account_number',
                'bank_account_holder',
            ]);
        });

        DB::table('settings')->whereIn('key', [
            'affiliate_enabled',
            'affiliate_commission_default',
            'affiliate_min_payout',
        ])->delete();
    }
};
