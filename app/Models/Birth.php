<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Birth extends Model
{
    protected $fillable = [
        'breeding_cycle_id',
        'dam_id',
        'sire_id',
        'born_on',
        'offspring_total',
        'offspring_alive',
        'difficulty',
        'notes',
    ];

    protected $casts = [
        'born_on' => 'date',
    ];

    /**
     * Mirrors this birth's date onto its breeding cycle's `birthed_on` —
     * the durable "this cycle resulted in a birth" fact that has to
     * survive even after this Birth row is deleted (see the
     * add_birthed_on_to_breeding_cycles_table migration for why). Lives
     * here rather than in BirthController so it applies no matter how a
     * Birth gets created/updated (factories, tinker, future code paths),
     * not just through the one controller action that exists today.
     *
     * Deliberately no `deleting`/`deleted` hook: leaving birthed_on
     * untouched when a Birth is deleted is the entire point.
     */
    protected static function boot()
    {
        parent::boot();

        static::created(function (Birth $birth) {
            $birth->syncCycleBirthedOn();
        });

        static::updated(function (Birth $birth) {
            if ($birth->wasChanged('breeding_cycle_id')) {
                $previousCycleId = $birth->getOriginal('breeding_cycle_id');

                if ($previousCycleId) {
                    BreedingCycle::whereKey($previousCycleId)->update(['birthed_on' => null]);
                }
            }

            $birth->syncCycleBirthedOn();
        });
    }

    private function syncCycleBirthedOn(): void
    {
        if ($this->breeding_cycle_id) {
            BreedingCycle::whereKey($this->breeding_cycle_id)->update(['birthed_on' => $this->born_on]);
        }
    }

    public function breedingCycle()
    {
        return $this->belongsTo(BreedingCycle::class);
    }

    public function dam()
    {
        return $this->belongsTo(Animal::class, 'dam_id');
    }

    public function sire()
    {
        return $this->belongsTo(Animal::class, 'sire_id');
    }

    /**
     * The live offspring this birth produced as real animal records.
     * Stillbirths (offspring_total - offspring_alive) are never animals —
     * they're only ever a count on this row.
     */
    public function animals()
    {
        return $this->hasMany(Animal::class, 'birth_id');
    }
}
