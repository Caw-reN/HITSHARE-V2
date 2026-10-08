<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('website_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('website_id')->constrained()->cascadeOnDelete();
            $table->string('label')->default('Akun 1');
            $table->longText('cookie_data')->nullable(); // JSON array of cookies
            $table->timestamp('cookie_updated_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('website_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_accounts');
    }
};
