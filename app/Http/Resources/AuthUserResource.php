<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Authenticated user with store + subscription gating info.
 *
 * @property User $resource
 */
class AuthUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->resource;
        $store = $user->store;

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->value,
            'store' => $store === null ? null : [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'status' => $store->status->value,
                'is_operational' => $store->isOperational(),
                'subscription' => $store->subscription === null ? null : [
                    'status' => $store->subscription->status->value,
                    'package_name' => $store->subscription->package_name,
                    'package_price' => (float) $store->subscription->package_price,
                    'ends_at' => $store->subscription->ends_at?->toIso8601String(),
                ],
            ],
        ];
    }
}
