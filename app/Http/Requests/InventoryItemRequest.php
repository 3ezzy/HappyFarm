<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $farmId = $this->user()?->farm?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('inventory_items', 'name')->where(fn ($q) => $q->where('farm_id', $farmId)),
            ],
            'unit' => 'required|string|max:50',
            'low_stock_threshold' => 'nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The item name field is required.',
            'name.unique' => 'You already have an item with this name.',
            'unit.required' => 'The unit field is required.',
            'low_stock_threshold.numeric' => 'The low-stock threshold must be a number.',
            'low_stock_threshold.min' => 'The low-stock threshold cannot be negative.',
        ];
    }
}
