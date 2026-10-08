<?php

namespace App\Http\Controllers\Api\StoreAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdmin\OrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\User;
use App\Support\Enums\OrderStatus;
use App\Support\StoreCache;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        assert($user instanceof User);

        $store = $user->store()->firstOrFail();

        $query = Order::query()
            ->where('store_id', $store->id)
            ->with('items')
            ->orderByDesc('created_at');

        $status = $request->query('status');

        if (is_string($status) && $status !== '') {
            $query->where('status', $status);
        }

        return OrderResource::collection($query->paginate(15)->withQueryString());
    }

    public function show(Order $order): OrderResource
    {
        $this->authorize('view', $order);

        return new OrderResource($order->loadMissing('items'));
    }

    public function updateStatus(OrderStatusRequest $request, Order $order): OrderResource
    {
        $this->authorize('update', $order);

        $order->update(['status' => $request->enum('status', OrderStatus::class)]);

        StoreCache::bumpVersion($order->store_id);

        return new OrderResource($order->refresh()->loadMissing('items'));
    }
}
