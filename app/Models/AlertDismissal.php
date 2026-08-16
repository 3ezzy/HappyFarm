<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlertDismissal extends Model
{
    protected $fillable = [
        'farm_id',
        'alert_key',
        'dismissed_at',
    ];

    protected $casts = [
        'dismissed_at' => 'datetime',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }
}
