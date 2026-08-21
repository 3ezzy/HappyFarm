<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Append-only ledger — see InventoryController for why there's no
 * update()/destroy() for individual transactions. current_stock is never
 * stored anywhere; it's always SUM(restock) - SUM(consume) over these
 * rows, computed at read time by InventoryItem::currentStock().
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['restock', 'consume']);
            $table->decimal('quantity', 10, 2);
            $table->date('transaction_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['inventory_item_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
