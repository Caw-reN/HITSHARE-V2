<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Create plans table if not exists
        if (!Schema::hasTable('plans')) {
            Schema::create('plans', function (Blueprint $table) {
                $table->id();
                $table->string('plan', 50)->unique();
                $table->string('label', 100);
                $table->integer('amount');
                $table->integer('duration_days');
                $table->integer('original_price')->nullable()->default(0);
                $table->string('badge', 50)->nullable();
                $table->string('description', 255)->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->index('is_active');
                $table->index('sort_order');
            });
        }

        // 2. Change orders.plan and vouchers.applies_to from enum to string so custom plans work seamlessly
        try {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('plan', 50)->change();
            });
        } catch (\Throwable $e) {
            // Ignore if already string
        }

        try {
            Schema::table('vouchers', function (Blueprint $table) {
                $table->string('applies_to', 50)->default('all')->change();
            });
        } catch (\Throwable $e) {
            // Ignore if already string
        }

        // 3. Seed default 3 plans if empty
        if (DB::table('plans')->count() === 0) {
            // Check if settings table has existing plan prices
            $settings = DB::table('settings')->whereIn('key', [
                'plan_monthly_price', 'plan_monthly_days', 'plan_monthly_original',
                'plan_6months_price', 'plan_6months_days', 'plan_6months_original',
                'plan_yearly_price', 'plan_yearly_days', 'plan_yearly_original',
            ])->pluck('value', 'key')->toArray();

            $now = now();
            DB::table('plans')->insert([
                [
                    'plan'           => 'monthly',
                    'label'          => '1 Bulan',
                    'amount'         => (int) ($settings['plan_monthly_price'] ?? 25000),
                    'duration_days'  => (int) ($settings['plan_monthly_days'] ?? 30),
                    'original_price' => (int) ($settings['plan_monthly_original'] ?? 35000),
                    'badge'          => null,
                    'description'    => 'Akses penuh 30 hari',
                    'is_active'      => true,
                    'sort_order'     => 1,
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ],
                [
                    'plan'           => '6months',
                    'label'          => '6 Bulan',
                    'amount'         => (int) ($settings['plan_6months_price'] ?? 120000),
                    'duration_days'  => (int) ($settings['plan_6months_days'] ?? 180),
                    'original_price' => (int) ($settings['plan_6months_original'] ?? 150000),
                    'badge'          => 'Hemat 20%',
                    'description'    => '~Rp 20.000/bln',
                    'is_active'      => true,
                    'sort_order'     => 2,
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ],
                [
                    'plan'           => 'yearly',
                    'label'          => '1 Tahun',
                    'amount'         => (int) ($settings['plan_yearly_price'] ?? 200000),
                    'duration_days'  => (int) ($settings['plan_yearly_days'] ?? 365),
                    'original_price' => (int) ($settings['plan_yearly_original'] ?? 300000),
                    'badge'          => 'Terbaik',
                    'description'    => '~Rp 16.667/bln',
                    'is_active'      => true,
                    'sort_order'     => 3,
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ],
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
