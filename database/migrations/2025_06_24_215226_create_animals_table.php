<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('animals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['sheep', 'goat', 'cow', 'camel']);
            $table->string('name');
            $table->decimal('age', 4, 2); // Supports decimal ages (e.g., 0.5 for 6 months)
            $table->timestamp('fed_at')->nullable();
            $table->timestamp('groomed_at')->nullable();
            $table->timestamp('sacrificed_at')->nullable();
            $table->boolean('is_sacrificed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('animals');
    }
};
