<?php

namespace App\Http\Resources;

use App\Models\PaymentChannel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property PaymentChannel $resource
 */
class PaymentChannelResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'account_number' => $this->resource->account_number,
            'instructions' => $this->resource->instructions,
            'is_active' => (bool) $this->resource->is_active,
        ];
    }
}
