<?php

namespace App\Http\Resources;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Store $resource
 */
class StoreResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $store = $this->resource;

        return [
            'id' => $store->id,
            'name' => $store->name,
            'slug' => $store->slug,
            'description' => $store->description,
            'status' => $store->status->value,
            'is_operational' => $store->isOperational(),
            'subscription' => new SubscriptionResource($this->whenLoaded('subscription')),
            'owners' => UserResource::collection($this->whenLoaded('users')),
            'categories_count' => $this->whenCounted('categories'),
            'products_count' => $this->whenCounted('products'),
            'orders_count' => $this->whenCounted('orders'),
            'created_at' => $store->created_at->toIso8601String(),
        ];
    }
}
