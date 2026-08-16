<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Weight extends Model
{
    protected $fillable = [
        'animal_id',
        'weight_kg',
        'measured_at',
        'notes',
    ];

    protected $casts = [
        'measured_at' => 'date',
        'weight_kg' => 'decimal:2',
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class);
    }
}
