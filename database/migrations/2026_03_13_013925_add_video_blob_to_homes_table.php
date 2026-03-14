<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('homes', function (Blueprint $table) {
            if (! Schema::hasColumn('homes', 'heroVideoData')) {
                $table->longText('heroVideoData')->nullable();
            }
            if (! Schema::hasColumn('homes', 'heroVideoMime')) {
                $table->string('heroVideoMime', 50)->nullable();
            }
            if (! Schema::hasColumn('homes', 'heroVideoName')) {
                $table->string('heroVideoName', 255)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('homes', function (Blueprint $table) {
            $table->dropColumn(['heroVideoData', 'heroVideoMime', 'heroVideoName']);
        });
    }
};
