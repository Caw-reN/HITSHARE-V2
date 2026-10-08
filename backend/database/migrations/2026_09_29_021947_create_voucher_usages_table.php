<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('voucher_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('voucher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('order_id')->nullable();
            $table->integer('discount_amount');
            $table->timestamp('used_at')->nullable();

            $table->index('voucher_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('voucher_usages');
    }
};
