<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ministry_videos', function (Blueprint $table) {
            $table->id();
            $table->string('ministryId', 100)->index();
            $table->longText('videoData')->nullable();
            $table->string('videoMime', 50)->nullable();
            $table->string('videoName', 255)->nullable();
            $table->unsignedInteger('sortOrder')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ministry_videos');
    }
};
