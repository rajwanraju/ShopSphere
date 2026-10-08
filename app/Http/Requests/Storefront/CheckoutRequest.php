<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_email' => ['nullable', 'string', 'lowercase', 'email', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:32'],
            'customer_address' => ['required', 'string', 'max:500'],
        ];
    }
}
