<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
        return [
            'type' => 'required|string|in:sheep,goat,cow,camel',
            'name' => 'required|string|max:255|min:1',
            'age' => 'required|numeric|min:0|max:50',
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
            'age.required' => 'The animal age field is required.',
            'age.numeric' => 'The animal age must be a number.',
            'age.min' => 'The animal age must be at least 0.',
            'age.max' => 'The animal age may not be greater than 50 years.',
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
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Additional custom validation logic can be added here
            if ($this->has('age') && $this->has('type')) {
                $age = (float) $this->input('age');
                $type = $this->input('type');
                
                // Validate sacrifice eligibility age minimums
                $minAges = [
                    'sheep' => 0.5,  // 6 months
                    'goat' => 1,     // 1 year
                    'cow' => 2,      // 2 years
                    'camel' => 5,    // 5 years
                ];
                
                // Note: This is just informational - we allow adding young animals
                // but they won't be eligible for sacrifice until they reach proper age
            }
        });
    }
}
