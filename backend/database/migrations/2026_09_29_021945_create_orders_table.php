<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('order_id')->unique();
            $table->enum('plan', ['monthly', '6months', 'yearly']);
            $table->integer('amount');           // total bayar (termasuk fee)
            $table->integer('original_amount')->nullable();
            $table->integer('discount_amount')->default(0);
            $table->integer('admin_fee')->default(0);
            $table->integer('duration_days');
            $table->enum('status', ['pending', 'paid', 'expired', 'failed', 'cancelled'])->default('pending');
            $table->string('payment_txn_id')->nullable();  // trx_id dari Paymenku
            $table->text('qr_url')->nullable();
            $table->text('qr_string')->nullable();
            $table->string('voucher_code')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();   // kapan QR kadaluwarsa (15 mnt)
            $table->timestamps();

            $table->index('user_id');
            $table->index('order_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
