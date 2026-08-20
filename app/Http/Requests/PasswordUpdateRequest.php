<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PasswordUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // 'current_password' validates against the authenticated
            // user's actual password via Hash::check under the hood —
            // no need to look it up and compare manually.
            'current_password' => 'required|current_password',
            'password' => 'required|string|min:8|confirmed|different:current_password',
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Please enter your current password.',
            'current_password.current_password' => 'The current password is incorrect.',
            'password.required' => 'Please enter a new password.',
            'password.min' => 'The new password must be at least 8 characters.',
            'password.confirmed' => 'The new password confirmation does not match.',
            'password.different' => 'The new password must be different from the current password.',
        ];
    }
}
