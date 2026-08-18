<?php

namespace App\Http\Requests;

use App\Models\Animal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Used only by BirthController::store() — recording a birth creates real
 * animal records, so this validates the full offspring array. update()
 * uses inline validation for birth-level fields only; editing a birth
 * doesn't retroactively create/remove the animals it already produced.
 */
class BirthRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $farmId = $this->user()?->farm?->id;

        return [
            // Structural check only. Rule::exists()->where()'s closure runs
            // against a plain query builder, not an Eloquent one — it has
            // no whereHas(), so a relationship-aware check can't live here.
            // Confirming this cycle actually belongs to *this* dam (a
            // tighter, more correct check than merely "some animal on my
            // farm") happens in BirthController::store(), which already
            // has the resolved $dam to check against.
            'breeding_cycle_id' => 'nullable|integer',
            'sire_id' => [
                'nullable',
                'integer',
                Rule::exists('animals', 'id')->where(
                    fn ($q) => $q->where('farm_id', $farmId)->where('sex', 'male')
                ),
            ],
            'born_on' => 'required|date|before_or_equal:today',
            'offspring_total' => 'required|integer|min:0',
            'offspring_alive' => 'required|integer|min:0|lte:offspring_total',
            'difficulty' => 'nullable|in:easy,assisted,difficult,cesarean',
            'notes' => 'nullable|string|max:1000',
            'offspring' => 'required|array',
            'offspring.*.name' => 'required|string|max:255',
            'offspring.*.sex' => 'required|in:male,female',
            'offspring.*.tag' => 'nullable|string|max:50',
            'offspring.*.birth_weight_kg' => 'nullable|numeric|min:0|max:9999.99',
        ];
    }

    public function messages(): array
    {
        return [
            'breeding_cycle_id.exists' => 'The selected breeding cycle does not belong to your farm.',
            'sire_id.exists' => 'The selected sire must be a male animal on your farm.',
            'offspring_alive.lte' => 'The number alive cannot exceed the total born.',
            'offspring.required' => 'Add an entry for each live offspring.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $offspring = $this->input('offspring', []);
            $aliveCount = (int) $this->input('offspring_alive');

            if (is_array($offspring) && count($offspring) !== $aliveCount) {
                $validator->errors()->add(
                    'offspring',
                    'The number of offspring entries must match offspring_alive.'
                );
            }

            $tags = collect($offspring)->pluck('tag')->filter()->values();

            if ($tags->duplicates()->isNotEmpty()) {
                $validator->errors()->add('offspring', 'Offspring tags must be unique within this birth.');
                return;
            }

            $farmId = $this->user()?->farm?->id;

            if ($tags->isNotEmpty() && $farmId && Animal::where('farm_id', $farmId)->whereIn('tag', $tags)->exists()) {
                $validator->errors()->add('offspring', 'One or more tags are already used by an animal on your farm.');
            }
        });
    }
}
