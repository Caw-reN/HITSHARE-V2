<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('website_clicks', function (Blueprint $table) {
            $table->id();
            $table->string('website_name');
            $table->string('website_url')->default('');
            $table->string('user_email')->default('');
            $table->timestamp('clicked_at')->useCurrent();

            $table->index('website_name');
            $table->index('clicked_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_clicks');
    }
};
