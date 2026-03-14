<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meeting_days', function (Blueprint $table) {
            if (! Schema::hasColumn('meeting_days', 'heroImageData')) {
                $table->longText('heroImageData')->nullable();
            }
            if (! Schema::hasColumn('meeting_days', 'heroImageMime')) {
                $table->string('heroImageMime', 50)->nullable();
            }
            if (! Schema::hasColumn('meeting_days', 'heroImageName')) {
                $table->string('heroImageName', 255)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('meeting_days', function (Blueprint $table) {
            $table->dropColumn(['heroImageData', 'heroImageMime', 'heroImageName']);
        });
    }
};
