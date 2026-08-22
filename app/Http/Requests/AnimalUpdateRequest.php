<?php

namespace App\Http\Requests;

use App\Models\Animal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Full-object replace, mirroring AnimalRequest (creation) with three
 * differences: tag uniqueness excludes this animal itself, dam_id/sire_id
 * self-reference is newly possible (impossible at creation, since the
 * animal has no id yet), and species/sex become locked once this animal
 * has breeding history — checked in withValidator() since it needs to
 * load the current row to compare against.
 */
class AnimalUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $farmId = $this->user()?->farm?->id;
        $animalId = $this->route('id');
        $type = $this->input('type');
        $maturityCutoff = Animal::maturityCutoffDate($type);
        $current = Animal::find($animalId);

        // Same dam_id/sire_id eligibility as AnimalRequest — same species,
        // correct sex, on this farm, not archived, hasn't exited, old
        // enough per Animal::MIN_AGES — but only when the value is actually
        // changing. Resubmitting the animal's existing dam_id/sire_id
        // unchanged (full-object-replace form) must keep passing even if
        // that parent has since been archived or exited: existing
        // historical relationships stay intact (see Animal::dam()/sire()
        // withTrashed()), only *new* selections are gated. Self-reference
        // is checked separately below in withValidator(), since it needs
        // $animalId rather than a query condition.
        $parentRule = function (string $sex, ?int $currentValue) use ($farmId, $type, $maturityCutoff) {
            return function ($attribute, $value, $fail) use ($sex, $currentValue, $farmId, $type, $maturityCutoff) {
                if ((int) $value === $currentValue) {
                    return;
                }

                $exists = Animal::where('id', $value)
                    ->where('farm_id', $farmId)
                    ->where('type', $type)
                    ->where('sex', $sex)
                    ->whereNull('deleted_at')
                    ->whereNull('exit_reason')
                    ->where('date_of_birth', '<=', $maturityCutoff)
                    ->exists();

                if (!$exists) {
                    $fail('The selected ' . ($sex === 'female' ? 'mother' : 'father') . ' is not one of your animals.');
                }
            };
        };

        return [
            'type' => 'required|string|in:sheep,goat,cow,camel',
            'name' => 'required|string|max:255|min:1',
            'tag' => [
                'nullable',
                'string',
                'max:50',
                // Same reasoning as AnimalRequest: Rule::unique() doesn't
                // know about SoftDeletes, so archived rows need to be
                // excluded explicitly to match the partial DB index.
                Rule::unique('animals', 'tag')->where(fn ($q) => $q->where('farm_id', $farmId)->whereNull('deleted_at'))->ignore($animalId),
            ],
            'breed_id' => [
                'nullable',
                'integer',
                // Same reasoning as AnimalRequest: a breed is assignable
                // if it's global (farm_id null) or owned by this farm.
                Rule::exists('breeds', 'id')->where(fn ($q) => $q->whereNull('farm_id')->orWhere('farm_id', $farmId)),
            ],
            'sex' => 'nullable|in:male,female',
            'age' => 'nullable|numeric|min:0|max:50',
            'date_of_birth' => 'nullable|date|before_or_equal:today',
            'date_of_purchase' => 'nullable|date|before_or_equal:today',
            'origin' => 'nullable|in:born,purchased',
            'dam_id' => [
                'nullable',
                'integer',
                $parentRule('female', $current?->dam_id),
            ],
            'sire_id' => [
                'nullable',
                'integer',
                $parentRule('male', $current?->sire_id),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'The animal type field is required.',
            'type.in' => 'The animal type must be one of: sheep, goat, cow, camel.',
            'name.required' => 'The animal name field is required.',
            'tag.unique' => 'You already have an animal with this tag.',
            'breed_id.exists' => 'Please select a valid breed.',
            // dam_id/sire_id use closure-based rules (see rules() above),
            // which supply their own $fail() message directly.
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (!$this->filled('age') && !$this->filled('date_of_birth')) {
                $validator->errors()->add('age', 'Either age or date of birth is required.');
            }

            if ($this->input('origin') === 'born' && $this->filled('date_of_purchase')) {
                $validator->errors()->add('date_of_purchase', 'An animal born on the farm cannot have a purchase date.');
            }

            $animalId = (int) $this->route('id');

            if ($this->filled('dam_id') && (int) $this->dam_id === $animalId) {
                $validator->errors()->add('dam_id', 'An animal cannot be its own mother.');
            }

            if ($this->filled('sire_id') && (int) $this->sire_id === $animalId) {
                $validator->errors()->add('sire_id', 'An animal cannot be its own father.');
            }

            $animal = Animal::find($animalId);

            if (!$animal) {
                return;
            }

            $hasBreedingHistory = $animal->breedingCycles()->exists()
                || Animal::where('dam_id', $animal->id)->orWhere('sire_id', $animal->id)->exists();

            if (!$hasBreedingHistory) {
                return;
            }

            if ($this->filled('type') && $this->type !== $animal->type) {
                $validator->errors()->add('type', 'Species cannot be changed once this animal has breeding history.');
            }

            if ($this->filled('sex') && $this->sex !== $animal->sex) {
                $validator->errors()->add('sex', 'Sex cannot be changed once this animal has breeding history.');
            }
        });
    }
}
