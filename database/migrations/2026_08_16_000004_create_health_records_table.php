<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('health_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained('animals')->cascadeOnDelete();
            $table->enum('kind', ['vaccine', 'antiparasitic', 'antibiotic', 'vitamin', 'disease', 'surgery', 'injury']);
            $table->string('product')->nullable();
            $table->string('dose')->nullable();
            $table->date('administered_on');
            $table->date('next_due_on')->nullable();
            $table->date('withdrawal_until')->nullable();
            $table->decimal('cost', 8, 2)->nullable();
            $table->string('veterinarian')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['animal_id', 'kind']);
            $table->index('next_due_on');
            $table->index('withdrawal_until');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('health_records');
    }
};
