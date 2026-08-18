<?php

namespace App\Http\Requests;

use App\Models\HealthRecord;
use Illuminate\Foundation\Http\FormRequest;

class HealthRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kind' => 'required|in:' . implode(',', HealthRecord::KINDS),
            'product' => 'nullable|string|max:255',
            'dose' => 'nullable|string|max:100',
            'administered_on' => 'required|date|before_or_equal:today',
            'next_due_on' => 'nullable|date|after:administered_on',
            'withdrawal_until' => 'nullable|date|after_or_equal:administered_on',
            'cost' => 'nullable|numeric|min:0|max:999999.99',
            'veterinarian' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'kind.required' => 'The record kind is required.',
            'kind.in' => 'The record kind must be one of: ' . implode(', ', HealthRecord::KINDS) . '.',
            'administered_on.required' => 'The date given is required.',
            'administered_on.before_or_equal' => 'The date given cannot be in the future.',
            'next_due_on.after' => 'The next due date must be after the date given.',
            'withdrawal_until.after_or_equal' => 'The withdrawal end date cannot be before the date given.',
        ];
    }
}
