<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Creates a custom breed owned by the caller's own farm. There is no way
 * to create a global (farm_id = null) breed through this endpoint — those
 * only ever come from BreedSeeder.
 */
class BreedRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $farmId = $this->user()?->farm?->id;

        return [
            'species' => 'required|string|in:sheep,goat,cow,camel',
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('breeds', 'name')->where(fn ($q) => $q->where('farm_id', $farmId)->where('species', $this->input('species'))),
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
}
