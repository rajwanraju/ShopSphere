<?php

namespace App\Http\Resources;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Subscription $resource
 */
class SubscriptionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $subscription = $this->resource;

        return [
            'id' => $subscription->id,
            'store_id' => $subscription->store_id,
            'package_id' => $subscription->package_id,
            'package_name' => $subscription->package_name,
            'package_price' => (float) $subscription->package_price,
            'package_duration_days' => $subscription->package_duration_days,
            'status' => $subscription->status->value,
            'starts_at' => $subscription->starts_at?->toIso8601String(),
            'ends_at' => $subscription->ends_at?->toIso8601String(),
            'store' => $this->whenLoaded(
                'store',
                fn (): array => [
                    'id' => $subscription->store->id,
                    'name' => $subscription->store->name,
                    'slug' => $subscription->store->slug,
                    'status' => $subscription->store->status->value,
                ],
            ),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
        ];
    }
}
