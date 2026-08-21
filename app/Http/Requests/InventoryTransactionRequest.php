<?php

namespace App\Http\Requests;

use App\Models\InventoryItem;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Append-only: this is the only way an inventory transaction is ever
 * created. There's no corresponding update()/destroy() — see
 * InventoryController for why. The negative-stock check below is what
 * actually enforces "stock must never go below zero"; everything else
 * about the derived current_stock is just arithmetic on top of it.
 */
class InventoryTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:restock,consume',
            'quantity' => 'required|numeric|min:0.01',
            'transaction_date' => 'required|date|before_or_equal:today',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'The transaction type field is required.',
            'type.in' => 'The transaction type must be either restock or consume.',
            'quantity.required' => 'The quantity field is required.',
            'quantity.min' => 'The quantity must be greater than zero.',
            'transaction_date.required' => 'The transaction date field is required.',
            'transaction_date.before_or_equal' => 'The transaction date cannot be in the future.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->type !== 'consume' || !is_numeric($this->quantity)) {
                return;
            }

            $item = InventoryItem::find($this->route('id'));

            if (!$item) {
                return;
            }

            if ((float) $this->quantity > $item->currentStock()) {
                $validator->errors()->add('quantity', 'This would take stock below zero. Only ' . $item->currentStock() . ' ' . $item->unit . ' available.');
            }
        });
    }
}
