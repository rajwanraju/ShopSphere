<?php

namespace App\Http\Controllers\Api\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\PaymentChannelRequest;
use App\Http\Resources\PaymentChannelResource;
use App\Models\PaymentChannel;
use App\Support\StoreCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PaymentChannelController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return PaymentChannelResource::collection(
            PaymentChannel::query()->orderBy('name')->get()
        );
    }

    public function store(PaymentChannelRequest $request): JsonResponse
    {
        $this->authorize('create', PaymentChannel::class);

        $channel = PaymentChannel::create($request->validated());

        StoreCache::flushPaymentChannels();

        return response()->json(['data' => new PaymentChannelResource($channel)], 201);
    }

    public function update(PaymentChannelRequest $request, PaymentChannel $paymentChannel): JsonResponse
    {
        $this->authorize('update', $paymentChannel);

        $paymentChannel->update($request->validated());

        StoreCache::flushPaymentChannels();

        return response()->json(['data' => new PaymentChannelResource($paymentChannel->refresh())]);
    }

    /**
     * Activate/deactivate a payment channel.
     */
    public function updateStatus(PaymentChannel $paymentChannel): JsonResponse
    {
        $this->authorize('update', $paymentChannel);

        $paymentChannel->update(['is_active' => ! $paymentChannel->is_active]);

        StoreCache::flushPaymentChannels();

        return response()->json(['data' => new PaymentChannelResource($paymentChannel->refresh())]);
    }

    public function destroy(PaymentChannel $paymentChannel): JsonResponse
    {
        $this->authorize('delete', $paymentChannel);

        $paymentChannel->delete();

        StoreCache::flushPaymentChannels();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
