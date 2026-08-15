<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('breeds', function (Blueprint $table) {
            $table->id();
            $table->enum('species', ['sheep', 'goat', 'cow', 'camel']);
            $table->string('name');
            $table->timestamps();

            $table->unique(['species', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('breeds');
    }
};
