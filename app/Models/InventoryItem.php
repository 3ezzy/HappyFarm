<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = [
        'farm_id',
        'name',
        'unit',
        'low_stock_threshold',
    ];

    protected $casts = [
        'low_stock_threshold' => 'decimal:2',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    /**
     * Always derived, never stored — SUM(restock) - SUM(consume) over the
     * append-only transaction log. See InventoryController for why
     * transactions can't be edited or deleted after the fact, which is
     * what keeps this simple: no need to replay history in order, just
     * sum both sides.
     */
    public function currentStock(): float
    {
        $restocked = $this->transactions()->where('type', 'restock')->sum('quantity');
        $consumed = $this->transactions()->where('type', 'consume')->sum('quantity');

        return (float) $restocked - (float) $consumed;
    }

    public function isLowStock(): bool
    {
        if ($this->low_stock_threshold === null) {
            return false;
        }

        return $this->currentStock() <= (float) $this->low_stock_threshold;
    }
}
