<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('births', function (Blueprint $table) {
            $table->id();
            $table->foreignId('breeding_cycle_id')->nullable()->constrained('breeding_cycles')->nullOnDelete();
            $table->foreignId('dam_id')->constrained('animals')->cascadeOnDelete();
            $table->foreignId('sire_id')->nullable()->constrained('animals')->nullOnDelete();
            $table->date('born_on');
            $table->smallInteger('offspring_total');
            $table->smallInteger('offspring_alive');
            $table->enum('difficulty', ['easy', 'assisted', 'difficult', 'cesarean'])->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['dam_id', 'born_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('births');
    }
};
