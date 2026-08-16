<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->string('tag')->nullable()->after('name');
            $table->foreignId('breed_id')->nullable()->after('type')->constrained()->nullOnDelete();
            $table->enum('sex', ['male', 'female'])->nullable()->after('breed_id');
            $table->date('date_of_birth')->nullable()->after('age');
            $table->date('date_of_purchase')->nullable()->after('date_of_birth');
            $table->enum('origin', ['born', 'purchased'])->nullable()->after('date_of_purchase');
            $table->foreignId('dam_id')->nullable()->after('origin')->constrained('animals')->nullOnDelete();
            $table->foreignId('sire_id')->nullable()->after('dam_id')->constrained('animals')->nullOnDelete();
            $table->date('exit_date')->nullable()->after('sacrificed_at');
            $table->enum('exit_reason', ['death', 'sale', 'slaughter', 'sacrifice'])->nullable()->after('exit_date');

            $table->unique(['farm_id', 'tag']);
        });

        // Back-fill date_of_birth from the existing `age` column (still present
        // at this point in the migration sequence; dropped in the next one).
        // Raw DB queries, not the Eloquent model, so this stays correct
        // regardless of how Animal's accessors change later.
        DB::table('animals')->whereNotNull('age')->orderBy('id')->each(function ($animal) {
            $days = (int) round(((float) $animal->age) * 365.25);

            DB::table('animals')
                ->where('id', $animal->id)
                ->update(['date_of_birth' => now()->subDays($days)->toDateString()]);
        });
    }

    public function down(): void
    {
        Schema::table('animals', function (Blueprint $table) {
            $table->dropUnique(['farm_id', 'tag']);
            $table->dropForeign(['breed_id']);
            $table->dropForeign(['dam_id']);
            $table->dropForeign(['sire_id']);
            $table->dropColumn([
                'tag',
                'breed_id',
                'sex',
                'date_of_birth',
                'date_of_purchase',
                'origin',
                'dam_id',
                'sire_id',
                'exit_date',
                'exit_reason',
            ]);
        });
    }
};
