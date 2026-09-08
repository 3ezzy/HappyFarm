<?php

namespace App\Http\Requests;

use App\Models\Animal;
use Illuminate\Foundation\Http\FormRequest;

class FeedingCostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'daily_cost' => 'required|numeric|min:0|max:999999.99',
            'effective_from' => 'nullable|date|before_or_equal:today',
        ];
    }

    public function messages(): array
    {
        return [
            'daily_cost.required' => 'The daily feeding cost is required.',
            'effective_from.before_or_equal' => 'The start date cannot be in the future.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (!$this->filled('effective_from')) {
                return;
            }

            $animal = Animal::find($this->route('id'));

            if ($animal?->date_of_birth && $this->effective_from < $animal->date_of_birth->toDateString()) {
                $validator->errors()->add('effective_from', 'The start date cannot be before this animal was born.');
            }
        });
    }
}
