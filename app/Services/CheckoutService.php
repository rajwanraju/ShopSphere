<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Support\Enums\OrderStatus;
use App\Support\StoreCache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(private CartService $cart) {}

    /**
     * Create an order from the current session cart. Product prices are
     * read from the database at creation time — never trusted from the
     * client — and everything is written in one transaction.
     *
     * @param  array<string, mixed>  $customer
     */
    public function placeOrder(Store $store, array $customer): Order
    {
        $lines = $this->cart->lines($store);

        if ($lines->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'Your cart is empty.',
            ]);
        }

        return DB::transaction(function () use ($store, $lines, $customer): Order {
            $products = Product::query()
                ->where('store_id', $store->id)
                ->whereIn('id', $lines->keys())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($products->count() !== $lines->count()) {
                throw ValidationException::withMessages([
                    'cart' => 'Some items in your cart are no longer available.',
                ]);
            }

            $subtotal = 0.0;
            $items = [];

            foreach ($lines as $productId => $quantity) {
                $product = $products->get($productId);
                $lineSubtotal = round((float) $product->price * $quantity, 2);
                $subtotal += $lineSubtotal;

                $items[] = [
                    'product_id' => $product->id,
                    'product_title' => $product->title,
                    'product_price' => $product->price,
                    'quantity' => $quantity,
                    'subtotal' => $lineSubtotal,
                ];
            }

            $order = Order::create([
                'store_id' => $store->id,
                'customer_name' => $customer['customer_name'],
                'customer_email' => $customer['customer_email'] ?? null,
                'customer_phone' => $customer['customer_phone'],
                'customer_address' => $customer['customer_address'],
                'status' => OrderStatus::Pending,
                'subtotal' => round($subtotal, 2),
                'total' => round($subtotal, 2),
            ]);

            $order->items()->createMany($items);

            $this->cart->clear($store);
            StoreCache::bumpVersion($store->id);

            return $order->load('items');
        });
    }
}
