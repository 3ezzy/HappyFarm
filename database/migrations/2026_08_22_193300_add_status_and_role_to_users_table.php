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
        Schema::table('users', function (Blueprint $table) {
            // Default 'approved' (not 'pending') so this backfills every
            // existing row for free — Postgres fills existing rows with a
            // column's default the moment it's added — and so UserFactory
            // (used throughout the existing test suite without setting
            // status explicitly) keeps producing usable, approved users.
            // AuthController::register() explicitly overrides to 'pending'
            // for new registrations; everything else inherits this default.
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('approved')->after('password');
            $table->enum('role', ['user', 'admin'])->default('user')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status', 'role']);
        });
    }
};
