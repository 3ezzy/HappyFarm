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
                Rule::exists('animals', 'id')->where(fn ($q) => $q->where('farm_id', $farmId)),
            ],
            'sire_id' => [
                'nullable',
                'integer',
                Rule::exists('animals', 'id')->where(fn ($q) => $q->where('farm_id', $farmId)),
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
            'dam_id.exists' => 'The selected mother is not one of your animals.',
            'sire_id.exists' => 'The selected father is not one of your animals.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (!$this->filled('age') && !$this->filled('date_of_birth')) {
                $validator->errors()->add('age', 'Either age or date of birth is required.');
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
