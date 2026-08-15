<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `age` was a stored decimal that was only ever correct on the day it was
 * entered. The previous migration back-filled `date_of_birth` from it for
 * every existing row; from here on age is computed from date_of_birth at
 * read time (see Animal::getAgeAttribute()).
 *
 * Rolling back re-adds the column but cannot restore the original values —
 * only a fresh `date_of_birth`-derived age is available at that point.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropColumn('age');
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->decimal('age', 4, 2)->nullable()->after('sex');
        });
    }
};
