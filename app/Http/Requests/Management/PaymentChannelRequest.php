<?php

namespace App\Http\Requests\Management;

use Illuminate\Foundation\Http\FormRequest;

class PaymentChannelRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:64'],
            'instructions' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
