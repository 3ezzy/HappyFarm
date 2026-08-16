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
