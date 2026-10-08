<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\Store;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartService $cart) {}

    public function index(Store $store): CartResource
    {
        return new CartResource($this->cart->get($store));
    }

    public function add(Request $request, Store $store): CartResource
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:99'],
        ]);

        return new CartResource($this->cart->add(
            $store,
            (int) $validated['product_id'],
            (int) ($validated['quantity'] ?? 1),
        ));
    }

    public function update(Request $request, Store $store, int $product): CartResource
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:0', 'max:99'],
        ]);

        return new CartResource($this->cart->update($store, $product, (int) $validated['quantity']));
    }

    public function remove(Store $store, int $product): CartResource
    {
        return new CartResource($this->cart->remove($store, $product));
    }

    public function clear(Store $store): JsonResponse
    {
        $this->cart->clear($store);

        return response()->json(['data' => ['items' => [], 'subtotal' => 0.0, 'count' => 0]]);
    }
}
