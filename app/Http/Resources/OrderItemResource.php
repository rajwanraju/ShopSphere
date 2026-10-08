<?php

namespace App\Http\Resources;

use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property OrderItem $resource
 */
class OrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'product_id' => $this->resource->product_id,
            'product_title' => $this->resource->product_title,
            'product_price' => (float) $this->resource->product_price,
            'quantity' => $this->resource->quantity,
            'subtotal' => (float) $this->resource->subtotal,
        ];
    }
}
