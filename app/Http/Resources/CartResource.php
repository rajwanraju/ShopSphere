<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Cart payload produced by CartService.
 *
 * @property array<string, mixed> $resource
 */
class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'items' => $this->resource['items'],
            'subtotal' => $this->resource['subtotal'],
            'count' => $this->resource['count'],
        ];
    }
}
