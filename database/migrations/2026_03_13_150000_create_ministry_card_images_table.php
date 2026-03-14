<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ministry_card_images', function (Blueprint $table) {
            $table->id();
            $table->string('ministryId', 100)->unique()->index();
            $table->longText('imageData')->nullable();
            $table->string('imageMime', 50)->nullable();
            $table->string('imageName', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ministry_card_images');
    }
};
