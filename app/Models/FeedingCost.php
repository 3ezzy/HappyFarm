<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class FeedingCost extends Model
{
    protected $fillable = [
        'animal_id',
        'daily_cost',
        'effective_from',
        'effective_until',
    ];

    protected $casts = [
        'daily_cost' => 'decimal:2',
        'effective_from' => 'date',
        'effective_until' => 'date',
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class);
    }

    public function isOpen(): bool
    {
        return $this->effective_until === null;
    }

    /**
     * Inclusive day count for this period, capped at $asOf (defaults to
     * today) while still open. Both endpoints count — Sep 1 to Sep 7 is
     * 7 days, not 6 — so consecutive periods never double-count or skip
     * a day as long as effective_from is always the prior period's
     * effective_until + 1 day.
     */
    public function daysAccrued(?Carbon $asOf = null): int
    {
        $end = $this->effective_until ?? ($asOf ?? Carbon::today());

        return $this->effective_from->diffInDays($end) + 1;
    }

    public function costAccrued(?Carbon $asOf = null): float
    {
        return round($this->daysAccrued($asOf) * (float) $this->daily_cost, 2);
    }
}
