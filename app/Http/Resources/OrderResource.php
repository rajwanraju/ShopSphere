<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Order $resource
 */
class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $order = $this->resource;

        return [
            'id' => $order->id,
            'store_id' => $order->store_id,
            'order_number' => $order->order_number,
            'status' => $order->status->value,
            'customer' => [
                'name' => $order->customer_name,
                'email' => $order->customer_email,
                'phone' => $order->customer_phone,
                'address' => $order->customer_address,
            ],
            'subtotal' => (float) $order->subtotal,
            'total' => (float) $order->total,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $order->created_at?->toIso8601String(),
        ];
    }
}
