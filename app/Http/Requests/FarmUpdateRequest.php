<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FarmUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The farm name field is required.',
            'name.max' => 'The farm name may not be greater than 255 characters.',
        ];
    }
}
