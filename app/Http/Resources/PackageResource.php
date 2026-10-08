<?php

namespace App\Http\Resources;

use App\Models\Package;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Package $resource
 */
class PackageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'name' => $this->resource->name,
            'description' => $this->resource->description,
            'price' => (float) $this->resource->price,
            'duration_days' => $this->resource->duration_days,
            'is_active' => (bool) $this->resource->is_active,
            'created_at' => $this->resource->created_at?->toIso8601String(),
        ];
    }
}
