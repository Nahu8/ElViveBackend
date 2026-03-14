<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('homes', function (Blueprint $table) {
            if (! Schema::hasColumn('homes', 'heroIconDomData')) {
                $table->longText('heroIconDomData')->nullable();
            }
            if (! Schema::hasColumn('homes', 'heroIconDomMime')) {
                $table->string('heroIconDomMime', 50)->nullable();
            }
            if (! Schema::hasColumn('homes', 'heroIconDomName')) {
                $table->string('heroIconDomName', 255)->nullable();
            }
            if (! Schema::hasColumn('homes', 'heroIconMierData')) {
                $table->longText('heroIconMierData')->nullable();
            }
            if (! Schema::hasColumn('homes', 'heroIconMierMime')) {
                $table->string('heroIconMierMime', 50)->nullable();
            }
            if (! Schema::hasColumn('homes', 'heroIconMierName')) {
                $table->string('heroIconMierName', 255)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('homes', function (Blueprint $table) {
            $table->dropColumn([
                'heroIconDomData', 'heroIconDomMime', 'heroIconDomName',
                'heroIconMierData', 'heroIconMierMime', 'heroIconMierName',
            ]);
        });
    }
};
