<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        try {
            Schema::table('vouchers', function (Blueprint $table) {
                $table->string('description', 255)->nullable()->default('')->change();
            });
        } catch (\Throwable $e) {
            // Fallback for drivers that don't support change() without doctrine/dbal
            try {
                \Illuminate\Support\Facades\DB::statement('ALTER TABLE vouchers MODIFY COLUMN description VARCHAR(255) NULL DEFAULT \'\'');
            } catch (\Throwable $ignored) {
            }
        }
    }

    public function down(): void
    {
        try {
            Schema::table('vouchers', function (Blueprint $table) {
                $table->string('description', 255)->nullable(false)->default('')->change();
            });
        } catch (\Throwable $e) {
        }
    }
};
