<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryItemRequest;
use App\Http\Requests\InventoryItemUpdateRequest;
use App\Http\Requests\InventoryTransactionRequest;
use App\Models\InventoryItem;
use Illuminate\Http\Request;

/**
 * Inventory items + their append-only transaction ledger. There is no
 * update()/destroy() for a transaction — see InventoryTransactionRequest
 * for why the ledger is deliberately immutable. Stock is always derived
 * (InventoryItem::currentStock()), never a stored column.
 */
class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $farmId = $request->user()->farm?->id;

        $items = InventoryItem::where('farm_id', $farmId)->orderBy('name')->get();

        return response()->json($items->map(fn ($item) => $this->present($item)));
    }

    public function store(InventoryItemRequest $request)
    {
        $item = InventoryItem::create([
            'farm_id' => $request->user()->farm->id,
            'name' => $request->name,
            'unit' => $request->unit,
            'low_stock_threshold' => $request->low_stock_threshold,
        ]);

        return response()->json($this->present($item), 201);
    }

    public function update(InventoryItemUpdateRequest $request, $id)
    {
        $item = $this->findOwnedItem($request, $id);

        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        $item->update([
            'name' => $request->name,
            'unit' => $request->unit,
            'low_stock_threshold' => $request->low_stock_threshold,
        ]);

        return response()->json($this->present($item));
    }

    /**
     * Only a clean item (zero transactions) can ever be deleted — same
     * precedent as breed deletion in Step 2. An item that's actually been
     * used keeps its transaction log forever; there's no archive concept
     * here since, unlike an animal, an inventory item has no lifecycle
     * beyond "in use or not".
     */
    public function destroy(Request $request, $id)
    {
        $item = $this->findOwnedItem($request, $id);

        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        if ($item->transactions()->exists()) {
            return response()->json(['error' => 'This item has recorded transactions and cannot be deleted.'], 422);
        }

        $item->delete();

        return response()->json(['message' => 'Item deleted']);
    }

    public function transactions(Request $request, $id)
    {
        $item = $this->findOwnedItem($request, $id);

        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        $transactions = $item->transactions()->orderByDesc('transaction_date')->orderByDesc('id')->get();

        return response()->json($transactions->map(fn ($t) => $this->presentTransaction($t)));
    }

    public function storeTransaction(InventoryTransactionRequest $request, $id)
    {
        $item = $this->findOwnedItem($request, $id);

        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        $transaction = $item->transactions()->create([
            'type' => $request->type,
            'quantity' => $request->quantity,
            'transaction_date' => $request->transaction_date,
            'notes' => $request->notes,
        ]);

        return response()->json($this->presentTransaction($transaction), 201);
    }

    private function findOwnedItem(Request $request, $id): ?InventoryItem
    {
        $farmId = $request->user()->farm?->id;

        return InventoryItem::where('farm_id', $farmId)->find($id);
    }

    private function present(InventoryItem $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'unit' => $item->unit,
            'low_stock_threshold' => $item->low_stock_threshold !== null ? (float) $item->low_stock_threshold : null,
            'current_stock' => $item->currentStock(),
            'is_low_stock' => $item->isLowStock(),
        ];
    }

    private function presentTransaction($transaction): array
    {
        return [
            'id' => $transaction->id,
            'type' => $transaction->type,
            'quantity' => (float) $transaction->quantity,
            'transaction_date' => $transaction->transaction_date->toDateString(),
            'notes' => $transaction->notes,
        ];
    }
}
