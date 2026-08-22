<?php

namespace App\Http\Requests;

use App\Models\Animal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnimalRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorized if user is authenticated (handled by middleware)
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $farmId = $this->user()?->farm?->id;
        $type = $this->input('type');
        $maturityCutoff = Animal::maturityCutoffDate($type);

        // A valid dam_id/sire_id below: same species as the animal being
        // created, correct sex, on this farm, not archived, hasn't exited
        // (death/sale/sacrifice), and old enough per Animal::MIN_AGES.
        // Self-reference is impossible here — this animal has no id yet.
        return [
            'type' => 'required|string|in:sheep,goat,cow,camel',
            'name' => 'required|string|max:255|min:1',
            'tag' => [
                'nullable',
                'string',
                'max:50',
                // Rule::unique() checks the raw table and doesn't know
                // about SoftDeletes — without excluding trashed rows here
                // too, an archived animal's tag would still block reuse
                // even though the partial DB index (deleted_at IS NULL)
                // would otherwise allow it.
                Rule::unique('animals', 'tag')->where(fn ($q) => $q->where('farm_id', $farmId)->whereNull('deleted_at')),
            ],
            'breed_id' => [
                'nullable',
                'integer',
                // A breed is assignable if it's global (farm_id null) or
                // owned by this farm — never another farm's private
                // custom breed.
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
                Rule::exists('animals', 'id')->where(function ($q) use ($farmId, $type, $maturityCutoff) {
                    $q->where('farm_id', $farmId)
                        ->where('type', $type)
                        ->where('sex', 'female')
                        ->whereNull('deleted_at')
                        ->whereNull('exit_reason')
                        ->where('date_of_birth', '<=', $maturityCutoff);
                }),
            ],
            'sire_id' => [
                'nullable',
                'integer',
                Rule::exists('animals', 'id')->where(function ($q) use ($farmId, $type, $maturityCutoff) {
                    $q->where('farm_id', $farmId)
                        ->where('type', $type)
                        ->where('sex', 'male')
                        ->whereNull('deleted_at')
                        ->whereNull('exit_reason')
                        ->where('date_of_birth', '<=', $maturityCutoff);
                }),
            ],
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'type.required' => 'The animal type field is required.',
            'type.in' => 'The animal type must be one of: sheep, goat, cow, camel.',
            'name.required' => 'The animal name field is required.',
            'name.min' => 'The animal name must have at least 1 character.',
            'name.max' => 'The animal name may not be greater than 255 characters.',
            'tag.unique' => 'You already have an animal with this tag.',
            'breed_id.exists' => 'Please select a valid breed.',
            'age.numeric' => 'The animal age must be a number.',
            'age.min' => 'The animal age must be at least 0.',
            'age.max' => 'The animal age may not be greater than 50 years.',
            'dam_id.exists' => 'The selected mother is not one of your animals.',
            'sire_id.exists' => 'The selected father is not one of your animals.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'type' => 'animal type',
            'name' => 'animal name',
            'age' => 'animal age',
            'date_of_birth' => 'date of birth',
            'date_of_purchase' => 'date of purchase',
            'dam_id' => 'mother',
            'sire_id' => 'father',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (!$this->filled('age') && !$this->filled('date_of_birth')) {
                $validator->errors()->add('age', 'Either age or date of birth is required.');
            }

            if ($this->input('origin') === 'born' && $this->filled('date_of_purchase')) {
                $validator->errors()->add('date_of_purchase', 'An animal born on the farm cannot have a purchase date.');
            }
        });
    }
}
