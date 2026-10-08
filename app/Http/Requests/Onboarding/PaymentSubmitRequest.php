<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaymentSubmitRequest extends FormRequest
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
            'payment_channel_id' => [
                'required',
                'integer',
                Rule::exists('payment_channels', 'id')->where('is_active', true),
            ],
            'account_number' => ['required', 'string', 'max:64'],
            'transaction_id' => ['required', 'string', 'max:64'],
        ];
    }
}
