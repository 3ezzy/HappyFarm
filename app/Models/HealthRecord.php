<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class HealthRecord extends Model
{
    public const KINDS = ['vaccine', 'antiparasitic', 'antibiotic', 'vitamin', 'disease', 'surgery', 'injury'];

    protected $fillable = [
        'animal_id',
        'kind',
        'product',
        'dose',
        'administered_on',
        'next_due_on',
        'withdrawal_until',
        'cost',
        'veterinarian',
        'notes',
    ];

    protected $casts = [
        'administered_on' => 'date',
        'next_due_on' => 'date',
        'withdrawal_until' => 'date',
        'cost' => 'decimal:2',
    ];

    public function animal()
    {
        return $this->belongsTo(Animal::class);
    }

    public function isWithdrawalActive(): bool
    {
        return $this->withdrawal_until !== null
            && $this->withdrawal_until->greaterThanOrEqualTo(Carbon::today());
    }
}
