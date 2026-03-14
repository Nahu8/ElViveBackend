<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('section_icons', function (Blueprint $table) {
            $table->id();
            $table->string('page_key', 50)->index();
            $table->string('section_key', 50)->index();
            $table->longText('imageData')->nullable();
            $table->string('imageMime', 50)->nullable();
            $table->string('imageName', 255)->nullable();
            $table->timestamps();
            $table->unique(['page_key', 'section_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('section_icons');
    }
};
