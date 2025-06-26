<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Animal extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'type',
        'name',
        'age',
        'fed_at',
        'groomed_at',
        'sacrificed_at',
        'is_sacrificed',
    ];

    protected $casts = [
        'fed_at' => 'datetime',
        'groomed_at' => 'datetime',
        'sacrificed_at' => 'datetime',
        'is_sacrificed' => 'boolean',
        'age' => 'decimal:2',
    ];

    /**
     * Get the farm that owns the animal.
     */
    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    /**
     * Automatically update is_sacrificed when sacrificed_at is set.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($animal) {
            if ($animal->isDirty('sacrificed_at')) {
                $animal->is_sacrificed = !is_null($animal->sacrificed_at);
            }
        });
    }

    /**
     * Check if animal is eligible for sacrifice based on age requirements
     */
    public function isEligibleForSacrifice()
    {
        $minAges = [
            'sheep' => 0.5,  // 6 months
            'goat' => 1,     // 1 year
            'cow' => 2,      // 2 years
            'camel' => 5,    // 5 years
        ];

        return $this->age >= ($minAges[$this->type] ?? 0);
    }

    /**
     * Get the eligibility error message for sacrifice
     */
    public function getSacrificeEligibilityError()
    {
        $messages = [
            'sheep' => 'Sheep must be at least 6 months old for sacrifice.',
            'goat' => 'Goat must be at least 1 year old for sacrifice.',
            'cow' => 'Cow must be at least 2 years old for sacrifice.',
            'camel' => 'Camel must be at least 5 years old for sacrifice.',
        ];

        return $messages[$this->type] ?? 'Animal is not eligible for sacrifice.';
    }
}
