<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Second hero video (Miercoles: Mon-Wed)
        Schema::table('homes', function (Blueprint $table) {
            if (! Schema::hasColumn('homes', 'heroVideo2Data')) {
                $table->longText('heroVideo2Data')->nullable();
            }
            if (! Schema::hasColumn('homes', 'heroVideo2Mime')) {
                $table->string('heroVideo2Mime', 50)->nullable();
            }
            if (! Schema::hasColumn('homes', 'heroVideo2Name')) {
                $table->string('heroVideo2Name', 255)->nullable();
            }
        });

        // Meeting card images table
        if (! Schema::hasTable('meeting_card_images')) {
            Schema::create('meeting_card_images', function (Blueprint $table) {
                $table->id();
                $table->unsignedInteger('cardIndex');
                $table->longText('imageData')->nullable();
                $table->string('imageMime', 50)->nullable();
                $table->string('imageName', 255)->nullable();
                $table->timestamps();
                $table->unique('cardIndex');
            });
        }
    }

    public function down(): void
    {
        Schema::table('homes', function (Blueprint $table) {
            $table->dropColumn(['heroVideo2Data', 'heroVideo2Mime', 'heroVideo2Name']);
        });
        Schema::dropIfExists('meeting_card_images');
    }
};
