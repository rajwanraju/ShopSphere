<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Session;
use Illuminate\Validation\ValidationException;

/**
 * Guest cart stored in the session, isolated per store. Prices and
 * totals are always recalculated from the database.
 */
class CartService
{
    private const MAX_QUANTITY = 99;

    /**
     * Return the hydrated cart for the store with server-side totals.
     *
     * @return array{items: array<int, array<string, mixed>>, subtotal: float, count: int}
     */
    public function get(Store $store): array
    {
        $lines = $this->lines($store);

        $products = Product::query()
            ->where('store_id', $store->id)
            ->whereIn('id', $lines->keys())
            ->get()
            ->keyBy('id');

        $items = [];
        $subtotal = 0.0;
        $count = 0;

        foreach ($lines as $productId => $quantity) {
            $product = $products->get($productId);

            if ($product === null) {
                continue;
            }

            $lineTotal = (float) $product->price * $quantity;
            $subtotal += $lineTotal;
            $count += $quantity;

            $items[] = [
                'product_id' => $product->id,
                'title' => $product->title,
                'price' => (float) $product->price,
                'quantity' => $quantity,
                'line_total' => round($lineTotal, 2),
                'image' => $product->images[0] ?? null,
            ];
        }

        return [
            'items' => $items,
            'subtotal' => round($subtotal, 2),
            'count' => $count,
        ];
    }

    /**
     * @return array{items: array<int, array<string, mixed>>, subtotal: float, count: int}
     */
    public function add(Store $store, int $productId, int $quantity = 1): array
    {
        $product = Product::query()
            ->where('store_id', $store->id)
            ->find($productId);

        if ($product === null) {
            throw ValidationException::withMessages([
                'product_id' => 'Product not found in this store.',
            ]);
        }

        $lines = $this->lines($store);
        $current = (int) ($lines->get($productId) ?? 0);
        $lines->put($productId, min($current + max(1, $quantity), self::MAX_QUANTITY));

        $this->saveLines($store, $lines);

        return $this->get($store);
    }

    /**
     * @return array{items: array<int, array<string, mixed>>, subtotal: float, count: int}
     */
    public function update(Store $store, int $productId, int $quantity): array
    {
        $lines = $this->lines($store);

        if (! $lines->has($productId)) {
            throw ValidationException::withMessages([
                'product_id' => 'Product is not in the cart.',
            ]);
        }

        if ($quantity <= 0) {
            $lines->forget($productId);
        } else {
            $lines->put($productId, min($quantity, self::MAX_QUANTITY));
        }

        $this->saveLines($store, $lines);

        return $this->get($store);
    }

    /**
     * @return array{items: array<int, array<string, mixed>>, subtotal: float, count: int}
     */
    public function remove(Store $store, int $productId): array
    {
        $lines = $this->lines($store);
        $lines->forget($productId);
        $this->saveLines($store, $lines);

        return $this->get($store);
    }

    public function clear(Store $store): void
    {
        Session::forget($this->key($store));
    }

    /**
     * Raw product_id => quantity lines for the store.
     *
     * @return Collection<int, int>
     */
    public function lines(Store $store): Collection
    {
        /** @var array<string|int, mixed> $raw */
        $raw = Session::get($this->key($store), []);

        return collect($raw)
            ->mapWithKeys(fn (mixed $quantity, mixed $productId): array => [(int) $productId => (int) $quantity]);
    }

    /**
     * @param  Collection<int, int>  $lines
     */
    private function saveLines(Store $store, Collection $lines): void
    {
        if ($lines->isEmpty()) {
            Session::forget($this->key($store));

            return;
        }

        Session::put($this->key($store), $lines->all());
    }

    private function key(Store $store): string
    {
        return "cart.store.{$store->id}";
    }
}
