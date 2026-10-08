<?php

namespace App\Http\Requests\Management;

use Illuminate\Foundation\Http\FormRequest;

class PaymentDecisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Used by the reject endpoint only; the decision itself is implied
     * by the route, so just the reason is required from the client.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'rejection_reason' => ['required', 'string', 'max:500'],
        ];
    }
}
