<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feeding_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_id')->constrained()->cascadeOnDelete();
            $table->decimal('daily_cost', 8, 2);
            $table->date('effective_from');
            $table->date('effective_until')->nullable();
            $table->timestamps();

            $table->index(['animal_id', 'effective_from']);
            $table->unique(['animal_id', 'effective_from']);
        });

        // At most one open (effective_until IS NULL) period per animal.
        // A partial unique index rather than a check constraint, since
        // this needs to compare across rows, not within one — supported
        // identically by SQLite (tests) and Postgres (dev/prod).
        DB::statement('CREATE UNIQUE INDEX feeding_costs_one_open_idx ON feeding_costs (animal_id) WHERE effective_until IS NULL');
    }

    public function down(): void
    {
        Schema::dropIfExists('feeding_costs');
    }
};
