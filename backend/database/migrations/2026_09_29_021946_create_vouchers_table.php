<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('description')->default('');
            $table->enum('discount_type', ['percent', 'fixed'])->default('percent');
            $table->integer('discount_value');
            $table->integer('max_uses')->default(0);      // 0 = unlimited
            $table->integer('used_count')->default(0);
            $table->integer('min_amount')->default(0);
            $table->enum('applies_to', ['all', 'monthly', '6months', 'yearly'])->default('all');
            $table->timestamp('valid_from')->nullable();
            $table->timestamp('valid_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('code');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
