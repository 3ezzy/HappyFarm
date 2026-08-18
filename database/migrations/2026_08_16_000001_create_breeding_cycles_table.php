<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('breeding_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained('animals')->cascadeOnDelete(); // dam
            $table->foreignId('sire_id')->nullable()->constrained('animals')->nullOnDelete();
            $table->enum('method', ['natural', 'ai']);
            $table->date('bred_on');
            $table->date('pregnancy_check_on')->nullable();
            $table->enum('pregnancy_result', ['pending', 'pregnant', 'not_pregnant', 'aborted'])->default('pending');
            $table->date('weaned_on')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['animal_id', 'pregnancy_result']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('breeding_cycles');
    }
};
