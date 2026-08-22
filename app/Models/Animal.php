<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Animal extends Model
{
    use HasFactory;
    use SoftDeletes;

    /**
     * Minimum age, in years, for sacrifice eligibility per species. Single
     * source of truth — the frontend previously kept its own copy of these
     * numbers in ANIMAL_META; that copy should read is_eligible/age from the
     * API instead of re-declaring the thresholds.
     */
    public const MIN_AGES = [
        'sheep' => 0.5,
        'goat' => 1,
        'cow' => 2,
        'camel' => 5,
    ];

    public const MIN_AGE_TEXT = [
        'sheep' => '6 months',
        'goat' => '1 year',
        'cow' => '2 years',
        'camel' => '5 years',
    ];

    protected $fillable = [
        'farm_id',
        'type',
        'name',
        'tag',
        'breed_id',
        'sex',
        'age',
        'date_of_birth',
        'date_of_purchase',
        'origin',
        'dam_id',
        'sire_id',
        'fed_at',
        'groomed_at',
        'sacrificed_at',
        'is_sacrificed',
        'exit_date',
        'exit_reason',
        'birth_id',
    ];

    protected $casts = [
        'fed_at' => 'datetime',
        'groomed_at' => 'datetime',
        'sacrificed_at' => 'datetime',
        'is_sacrificed' => 'boolean',
        'date_of_birth' => 'date',
        'date_of_purchase' => 'date',
        'exit_date' => 'date',
    ];

    /**
     * `age` has no backing column — it's derived from date_of_birth (see the
     * accessor/mutator below) — so it must be appended explicitly to show up
     * on $animal->toArray()/toJson().
     */
    protected $appends = ['age'];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function breed()
    {
        return $this->belongsTo(Breed::class);
    }

    /**
     * withTrashed(): a lamb's dam/sire must keep resolving even after that
     * parent is archived — otherwise an archived mother silently turns
     * into "Not recorded" on every descendant's profile.
     */
    public function dam()
    {
        return $this->belongsTo(Animal::class, 'dam_id')->withTrashed();
    }

    public function sire()
    {
        return $this->belongsTo(Animal::class, 'sire_id')->withTrashed();
    }

    public function weights()
    {
        return $this->hasMany(Weight::class);
    }

    /**
     * Cycles where this animal is the dam.
     */
    public function breedingCycles()
    {
        return $this->hasMany(BreedingCycle::class, 'animal_id');
    }

    /**
     * Births where this animal is the dam.
     */
    public function births()
    {
        return $this->hasMany(Birth::class, 'dam_id');
    }

    public function healthRecords()
    {
        return $this->hasMany(HealthRecord::class);
    }

    /**
     * The birth that created this animal, if it's a lamb/kid/calf born
     * on the farm rather than purchased or entered independently.
     */
    public function birth()
    {
        return $this->belongsTo(Birth::class);
    }

    /**
     * Age in years, computed from date_of_birth. Replaces the old stored
     * `age` decimal, which was only ever correct on the day it was entered.
     */
    public function getAgeAttribute(): ?float
    {
        if (!$this->date_of_birth) {
            return null;
        }

        return round($this->date_of_birth->diffInDays(Carbon::now()) / 365.25, 2);
    }

    /**
     * Lets callers keep writing `age` (AnimalController, seeders, existing
     * tests) without knowing date_of_birth exists. Converts years back into
     * a birth date; does not touch $this->attributes['age'] itself, so
     * nothing tries to persist a non-existent `age` column.
     */
    public function setAgeAttribute($value): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $days = (int) round(((float) $value) * 365.25);
        $this->attributes['date_of_birth'] = Carbon::now()->subDays($days)->toDateString();
    }

    /**
     * not_bred | bred | pregnant | nursing | available, derived from this
     * dam's most recent breeding cycle — never stored, so it can't drift
     * from the records it's computed from.
     *
     * Uses the already-loaded `breedingCycles` relation when present (the
     * case when listing many animals at once, e.g. farm statistics) to
     * avoid firing one query per animal; falls back to a direct query for
     * a single lazily-loaded model (e.g. the animal detail page). Reads
     * `birthed_on` rather than the cycle's `birth` relation, so this stays
     * correct even after that birth's log entry has been deleted.
     */
    public function getBreedingStatusAttribute(): string
    {
        $cycle = $this->relationLoaded('breedingCycles')
            ? $this->breedingCycles->sortByDesc('bred_on')->first()
            : $this->breedingCycles()->latest('bred_on')->first();

        if (!$cycle) {
            return 'not_bred';
        }

        if ($cycle->birthed_on !== null) {
            return $cycle->weaned_on ? 'available' : 'nursing';
        }

        return match ($cycle->pregnancy_result) {
            'pregnant' => 'pregnant',
            'not_pregnant', 'aborted' => 'available',
            default => 'bred',
        };
    }

    /**
     * The health record currently imposing a meat/milk withdrawal period
     * on this animal, if any — the most conservative one (latest
     * withdrawal_until) when more than one is active. Null once expired;
     * see AnimalController::sacrifice() for how this surfaces as a warning,
     * never a block, on sacrifice.
     */
    public function getActiveWithdrawalAttribute(): ?HealthRecord
    {
        $records = $this->relationLoaded('healthRecords')
            ? $this->healthRecords
            : $this->healthRecords()->whereNotNull('withdrawal_until')->get();

        return $records
            ->filter(fn (HealthRecord $r) => $r->isWithdrawalActive())
            ->sortByDesc('withdrawal_until')
            ->first();
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
     * True once the animal has left the active flock for any reason —
     * sacrifice, death, or sale. `is_sacrificed` deliberately keeps
     * meaning only "was sacrificed"; this is the broader check used to
     * block feed/groom/sacrifice/exit on an animal that's already exited
     * by any of the three routes.
     */
    public function hasExited(): bool
    {
        return $this->exit_reason !== null;
    }

    /**
     * Check if animal is eligible for sacrifice based on age requirements
     */
    public function isEligibleForSacrifice(): bool
    {
        if ($this->age === null) {
            return false;
        }

        return $this->age >= (self::MIN_AGES[$this->type] ?? 0);
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

    /**
     * Latest date_of_birth that still satisfies MIN_AGES[$type] as of today
     * — same math as getAgeAttribute()/setAgeAttribute(), exposed as a date
     * so it can be used inside Rule::exists()->where() closures, which run
     * against a plain query builder and can't call the age accessor.
     */
    public static function maturityCutoffDate(?string $type): string
    {
        $days = (int) round((self::MIN_AGES[$type] ?? 0) * 365.25);

        return Carbon::now()->subDays($days)->toDateString();
    }

    /**
     * Whether this animal meets MIN_AGES for its species — reused as the
     * breeding-maturity threshold per Phase 4 scope, rather than
     * introducing a second age table. Kept separate from
     * isEligibleForSacrifice() (even though the math is identical today)
     * so the two concepts don't silently couple if the thresholds ever
     * diverge.
     */
    public function isMatureForBreeding(): bool
    {
        if ($this->age === null) {
            return false;
        }

        return $this->age >= (self::MIN_AGES[$this->type] ?? 0);
    }

    /**
     * Not archived and hasn't exited (death/sale/sacrifice) — the
     * "active/valid for breeding" half of parent eligibility. Archived is
     * checked via trashed() rather than a fresh query, so this also works
     * on models loaded with withTrashed() (e.g. BreedingCycle::dam()).
     */
    public function isActiveForBreeding(): bool
    {
        return !$this->trashed() && !$this->hasExited();
    }

    /**
     * Mirrors getSacrificeEligibilityError() for the breeding-maturity
     * check above — same MIN_AGES thresholds, different context/wording.
     */
    public function getBreedingEligibilityError(): string
    {
        $messages = [
            'sheep' => 'Sheep must be at least 6 months old to be used for breeding.',
            'goat' => 'Goat must be at least 1 year old to be used for breeding.',
            'cow' => 'Cow must be at least 2 years old to be used for breeding.',
            'camel' => 'Camel must be at least 5 years old to be used for breeding.',
        ];

        return $messages[$this->type] ?? 'Animal is not eligible for breeding.';
    }
}
