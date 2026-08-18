<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Alerts themselves are never stored — computed at read time from
 * breeding_cycles/births/health_records (see AlertController). This table
 * only records that a specific, deterministically-keyed alert occurrence
 * was dismissed, so it can be excluded from the next computed list.
 * farm_id is denormalized (not derived via a relationship) because every
 * alert fetch needs a fast per-farm lookup on page load.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_dismissals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained('farms')->cascadeOnDelete();
            $table->string('alert_key');
            $table->timestamp('dismissed_at');
            $table->timestamps();

            $table->unique(['farm_id', 'alert_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_dismissals');
    }
};
