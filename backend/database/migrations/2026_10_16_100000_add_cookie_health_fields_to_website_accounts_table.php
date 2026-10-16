<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('website_accounts', function (Blueprint $table) {
            // Status: 'healthy', 'expiring_soon', 'logged_out', 'expired', 'empty'
            $table->string('cookie_status', 30)->default('empty')->after('is_active');
            $table->timestamp('cookie_expires_at')->nullable()->after('cookie_status');
            $table->timestamp('last_checked_at')->nullable()->after('cookie_expires_at');
            $table->string('health_message', 255)->nullable()->after('last_checked_at');

            $table->index(['cookie_status', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('website_accounts', function (Blueprint $table) {
            $table->dropIndex(['cookie_status', 'is_active']);
            $table->dropColumn(['cookie_status', 'cookie_expires_at', 'last_checked_at', 'health_message']);
        });
    }
};
