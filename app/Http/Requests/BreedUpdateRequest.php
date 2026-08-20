<?php

namespace App\Http\Requests;

use App\Models\Animal;
use App\Models\Breed;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Renames or re-species a custom breed. Species is locked once any
 * animal — including an archived one — references this breed, so an
 * animal can never end up pointing at a breed whose species no longer
 * matches its own. Name stays editable regardless.
 */
class BreedUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $farmId = $this->user()?->farm?->id;
        $breedId = $this->route('id');

        return [
            'species' => 'required|string|in:sheep,goat,cow,camel',
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('breeds', 'name')
                    ->where(fn ($q) => $q->where('farm_id', $farmId)->where('species', $this->input('species')))
                    ->ignore($breedId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'species.required' => 'The species field is required.',
            'species.in' => 'The species must be one of: sheep, goat, cow, camel.',
            'name.required' => 'The breed name field is required.',
            'name.unique' => 'You already have a breed with this name for this species.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $breed = Breed::find($this->route('id'));

            if (!$breed || !$this->filled('species') || $this->species === $breed->species) {
                return;
            }

            $isReferenced = Animal::withTrashed()->where('breed_id', $breed->id)->exists();

            if ($isReferenced) {
                $validator->errors()->add('species', 'Species cannot be changed while this breed is in use by an animal.');
            }
        });
    }
}
