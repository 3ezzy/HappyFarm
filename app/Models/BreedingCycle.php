<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class BreedingCycle extends Model
{
    /**
     * Centralized, per-species breeding timing — the single place every
     * derived date in the breeding flow reads from: how long after breeding
     * a pregnancy check is due, gestation length, weaning age, and how long
     * a dam rests after weaning before she's ready to breed again.
     *
     * Camel figures are provisional — camel reproductive management is
     * specialized and these are rough defaults, not authoritative numbers.
     * Correcting them later is a one-line change here, nothing else moves.
     */
    public const SPECIES_RULES = [
        'sheep' => ['gestation_days' => 147, 'check_days' => 45, 'weaning_days' => 90,  'rebreed_rest_days' => 45],
        'goat'  => ['gestation_days' => 150, 'check_days' => 40, 'weaning_days' => 70,  'rebreed_rest_days' => 40],
        'cow'   => ['gestation_days' => 283, 'check_days' => 35, 'weaning_days' => 210, 'rebreed_rest_days' => 60],
        'camel' => ['gestation_days' => 390, 'check_days' => 60, 'weaning_days' => 365, 'rebreed_rest_days' => 120],
    ];

    protected $fillable = [
        'animal_id',
        'sire_id',
        'method',
        'bred_on',
        'pregnancy_check_on',
        'pregnancy_result',
        'weaned_on',
        'birthed_on',
        'notes',
    ];

    protected $casts = [
        'bred_on' => 'date',
        'pregnancy_check_on' => 'date',
        'weaned_on' => 'date',
        'birthed_on' => 'date',
    ];

    // withTrashed(): this cycle's history must keep displaying the dam's/
    // sire's name even after that animal is later archived.
    public function dam()
    {
        return $this->belongsTo(Animal::class, 'animal_id')->withTrashed();
    }

    public function sire()
    {
        return $this->belongsTo(Animal::class, 'sire_id')->withTrashed();
    }

    public function birth()
    {
        return $this->hasOne(Birth::class);
    }

    /**
     * Falls back to sheep's rules only if the dam's species is somehow
     * missing — `animals.type` is NOT NULL, so this should never trigger;
     * it exists to avoid a null-array crash rather than to paper over a
     * real gap.
     */
    private function rules(): array
    {
        return self::SPECIES_RULES[$this->dam->type] ?? self::SPECIES_RULES['sheep'];
    }

    public function getExpectedCheckOnAttribute(): ?Carbon
    {
        if (!$this->bred_on) {
            return null;
        }

        return $this->bred_on->copy()->addDays($this->rules()['check_days']);
    }

    /**
     * Only meaningful once pregnancy is confirmed — an unconfirmed cycle
     * has no basis for an expected lambing date.
     */
    public function getExpectedLambingOnAttribute(): ?Carbon
    {
        if (!$this->bred_on || $this->pregnancy_result !== 'pregnant') {
            return null;
        }

        return $this->bred_on->copy()->addDays($this->rules()['gestation_days']);
    }

    public function getExpectedWeaningOnAttribute(): ?Carbon
    {
        if (!$this->birthed_on) {
            return null;
        }

        return $this->birthed_on->copy()->addDays($this->rules()['weaning_days']);
    }

    /**
     * bred → pregnant/not_pregnant/aborted → lambed. `birthed_on` being set
     * always wins over `pregnancy_result`, since a birth is itself proof of
     * pregnancy even if a check was never logged — and it's read from this
     * column rather than the `birth` relation specifically so that
     * deleting the birth's log entry (see Birth::destroy) can never make
     * this cycle look like it's still awaiting one.
     */
    public function getStatusAttribute(): string
    {
        if ($this->birthed_on !== null) {
            return 'lambed';
        }

        return match ($this->pregnancy_result) {
            'pregnant' => 'pregnant',
            'not_pregnant' => 'not_pregnant',
            'aborted' => 'aborted',
            default => 'bred',
        };
    }
}
