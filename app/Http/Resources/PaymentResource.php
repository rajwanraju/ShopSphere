<?php

namespace App\Http\Resources;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Payment $resource
 */
class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payment = $this->resource;

        return [
            'id' => $payment->id,
            'store_id' => $payment->store_id,
            'subscription_id' => $payment->subscription_id,
            'channel_name' => $payment->channel_name,
            'account_number' => $payment->account_number,
            'transaction_id' => $payment->transaction_id,
            'amount' => (float) $payment->amount,
            'status' => $payment->status->value,
            'rejection_reason' => $payment->rejection_reason,
            'verified_at' => $payment->verified_at !== null ? $payment->verified_at->toIso8601String() : null,
            'created_at' => $payment->created_at->toIso8601String(),
            'store' => $this->whenLoaded(
                'store',
                fn (): array => [
                    'id' => $payment->store->id,
                    'name' => $payment->store->name,
                    'slug' => $payment->store->slug,
                ],
            ),
            'subscription' => $this->whenLoaded(
                'subscription',
                fn (): array => [
                    'id' => $payment->subscription->id,
                    'package_name' => $payment->subscription->package_name,
                    'status' => $payment->subscription->status->value,
                ],
            ),
        ];
    }
}
