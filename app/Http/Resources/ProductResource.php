<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Product $resource
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'store_id' => $this->resource->store_id,
            'title' => $this->resource->title,
            'description' => $this->resource->description,
            'price' => (float) $this->resource->price,
            'images' => $this->imageUrls(),
            'category' => $this->whenLoaded('category', fn (): ?array => $this->resource->category === null ? null : [
                'id' => $this->resource->category->id,
                'title' => $this->resource->category->title,
            ]),
            'category_id' => $this->resource->category_id,
            'created_at' => $this->resource->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function imageUrls(): array
    {
        return collect($this->resource->images ?? [])
            ->map(fn (string $path): string => asset('storage/'.$path))
            ->values()
            ->all();
    }
}
