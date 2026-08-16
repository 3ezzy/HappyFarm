<?php

namespace App\Services;

use App\Models\Animal;
use App\Models\BreedingCycle;
use App\Models\Farm;
use Carbon\Carbon;

/**
 * Computes the farm's currently-due alerts at read time — nothing here is
 * ever stored, matching the "no scheduler, compute on open" design (see
 * AlertDismissal for how a specific occurrence gets suppressed once
 * acknowledged, which is the only thing that IS persisted).
 */
class AlertGenerator
{
    /** Days of advance notice before a due date — flat across every alert type. */
    public const LEAD_DAYS = 5;

    public function generate(Farm $farm): array
    {
        $farm->loadMissing(['animals.breedingCycles.birth', 'animals.healthRecords']);

        $alerts = [];

        foreach ($farm->animals as $animal) {
            if ($animal->is_sacrificed) {
                continue;
            }

            $alerts = [...$alerts, ...$this->breedingAlerts($animal), ...$this->healthAlerts($animal)];
        }

        return $alerts;
    }

    private function isDue(?Carbon $dueOn): bool
    {
        return $dueOn !== null && Carbon::today()->greaterThanOrEqualTo($dueOn->copy()->subDays(self::LEAD_DAYS));
    }

    private function breedingAlerts(Animal $animal): array
    {
        $alerts = [];
        $cycles = $animal->breedingCycles;

        $openCycle = $cycles->first(
            fn (BreedingCycle $c) => !$c->birth && in_array($c->pregnancy_result, ['pending', 'pregnant'])
        );

        if ($openCycle && $openCycle->pregnancy_result === 'pending' && $this->isDue($openCycle->expected_check_on)) {
            $alerts[] = $this->build('breeding_check_due', $animal, $openCycle->expected_check_on, [
                'cycle_id' => $openCycle->id,
            ]);
        }

        if ($openCycle && $openCycle->pregnancy_result === 'pregnant' && $this->isDue($openCycle->expected_lambing_on)) {
            $alerts[] = $this->build('lambing_due', $animal, $openCycle->expected_lambing_on, [
                'cycle_id' => $openCycle->id,
            ]);
        }

        $nursingCycle = $cycles->first(fn (BreedingCycle $c) => $c->birth && !$c->weaned_on);

        if ($nursingCycle && $this->isDue($nursingCycle->expected_weaning_on)) {
            $alerts[] = $this->build('weaning_due', $animal, $nursingCycle->expected_weaning_on, [
                'cycle_id' => $nursingCycle->id,
                'birth_id' => $nursingCycle->birth->id,
            ]);
        }

        // Only relevant once she's genuinely free: no unresolved pregnancy
        // question, and not currently nursing (weaning_due covers that case).
        if (!$openCycle && !$nursingCycle) {
            $lastClosed = $cycles
                ->filter(fn (BreedingCycle $c) => $this->cycleEndDate($c) !== null)
                ->sortByDesc(fn (BreedingCycle $c) => $this->cycleEndDate($c))
                ->first();

            if ($lastClosed) {
                $rules = BreedingCycle::SPECIES_RULES[$animal->type] ?? BreedingCycle::SPECIES_RULES['sheep'];
                $due = $this->cycleEndDate($lastClosed)->copy()->addDays($rules['rebreed_rest_days']);

                if ($this->isDue($due)) {
                    $alerts[] = $this->build('reinsemination_due', $animal, $due, [
                        'cycle_id' => $lastClosed->id,
                    ]);
                }
            }
        }

        return $alerts;
    }

    /**
     * A cycle only counts as closed — and so usable as the anchor for the
     * rebreed-rest calculation — once it's conclusively resolved: weaned
     * after a birth, or checked not_pregnant/aborted with no birth. A birth
     * with no weaning yet deliberately returns null here even though it's
     * not "open" either by BreedingCycleController's definition — she's
     * nursing, and weaning_due (above) is the relevant alert until weaning
     * is actually recorded.
     */
    private function cycleEndDate(BreedingCycle $cycle): ?Carbon
    {
        if ($cycle->birth && $cycle->weaned_on) {
            return $cycle->weaned_on;
        }

        if (!$cycle->birth && in_array($cycle->pregnancy_result, ['not_pregnant', 'aborted'])) {
            return $cycle->pregnancy_check_on;
        }

        return null;
    }

    private function healthAlerts(Animal $animal): array
    {
        $alerts = [];

        // One alert per kind, from its most recent record — an older
        // record's next_due_on is superseded automatically, never both.
        $latestPerKind = $animal->healthRecords
            ->whereNotNull('next_due_on')
            ->groupBy('kind')
            ->map(fn ($group) => $group->sortByDesc('administered_on')->first());

        foreach ($latestPerKind as $record) {
            if ($this->isDue($record->next_due_on)) {
                $alerts[] = $this->build('health_due', $animal, $record->next_due_on, [
                    'health_record_id' => $record->id,
                    'kind' => $record->kind,
                    'product' => $record->product,
                ]);
            }
        }

        return $alerts;
    }

    /**
     * Structured data only — never a rendered sentence. The frontend builds
     * the message from `type` (+ `animal_type` for species-correct wording
     * via i18next context), not the backend, unlike the sacrifice-
     * ineligibility error string, which is the one place in the app that
     * still can't be localized.
     */
    private function build(string $type, Animal $animal, Carbon $dueOn, array $extra): array
    {
        return [
            'type' => $type,
            'key' => $this->key($type, $animal, $extra),
            'animal_id' => $animal->id,
            'animal_name' => $animal->name,
            'animal_type' => $animal->type,
            'due_on' => $dueOn->toDateString(),
            'days_until' => (int) Carbon::today()->diffInDays($dueOn, false),
            ...$extra,
        ];
    }

    private function key(string $type, Animal $animal, array $extra): string
    {
        return match ($type) {
            'weaning_due' => "weaning_due:{$extra['birth_id']}",
            'health_due' => "health_due:{$extra['health_record_id']}",
            'reinsemination_due' => "reinsemination_due:{$animal->id}:{$extra['cycle_id']}",
            default => "{$type}:{$extra['cycle_id']}",
        };
    }
}
