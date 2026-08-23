<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Laravel's enum() compiles to a varchar column plus a CHECK constraint on
 * Postgres (confirmed against the real schema via pg_constraint before
 * writing this — no native Postgres enum type involved) and similarly on
 * SQLite (used by the test suite). Widening the allowed values on Postgres
 * needs a raw DROP/ADD CONSTRAINT — SQLite has no ALTER TABLE ... DROP
 * CONSTRAINT and no named constraint to target, so it goes through
 * Schema::change() instead, which Laravel 11+ handles natively per driver
 * without doctrine/dbal (not installed in this project).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('status', ['pending', 'approved', 'rejected', 'suspended'])->default('approved')->change();
            });

            return;
        }

        DB::statement('ALTER TABLE users DROP CONSTRAINT users_status_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))");
    }

    /**
     * Reverts to the previous 3-value set. If any rows are still
     * 'suspended' at rollback time, this will fail — same caveat as any
     * enum-narrowing rollback; no special handling here, matching how
     * this app's other migrations don't guard rollbacks against data that
     * no longer fits.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved')->change();
            });

            return;
        }

        DB::statement('ALTER TABLE users DROP CONSTRAINT users_status_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('pending', 'approved', 'rejected'))");
    }
};
