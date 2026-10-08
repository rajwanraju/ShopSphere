<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\CheckoutRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Store;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function __construct(private CheckoutService $checkout) {}

    /**
     * Create an order from the session cart.
     */
    public function store(CheckoutRequest $request, Store $store): JsonResponse
    {
        $order = $this->checkout->placeOrder($store, $request->validated());

        return response()->json([
            'data' => new OrderResource($order),
        ], 201);
    }

    /**
     * Order confirmation lookup by unguessable order number,
     * strictly scoped to the current store.
     */
    public function confirmation(Store $store, string $orderNumber): JsonResponse
    {
        $order = Order::query()
            ->where('store_id', $store->id)
            ->where('order_number', $orderNumber)
            ->with('items')
            ->firstOrFail();

        return response()->json([
            'data' => new OrderResource($order),
        ]);
    }
}
