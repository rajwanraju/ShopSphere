<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\PaymentSubmitRequest;
use App\Http\Resources\PaymentChannelResource;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\User;
use App\Services\PaymentService;
use App\Support\StoreCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnboardingPaymentController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    /**
     * Active payment channels for the subscription payment step.
     * Cached payloads are plain arrays — never Eloquent objects.
     */
    public function channels(): JsonResponse
    {
        $channels = StoreCache::paymentChannels();

        if (! is_array($channels)) {
            $channels = PaymentChannelResource::collection(
                PaymentChannel::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get()
            )->resolve();

            StoreCache::putPaymentChannels($channels);
        }

        return response()->json([
            'data' => $channels,
        ]);
    }

    /**
     * Onboarding status for the authenticated store owner: the store's
     * subscription state and its submitted payments.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        assert($user instanceof User);

        $store = $user->store()->firstOrFail();

        $subscription = $store->subscription()->firstOrFail();

        $payments = $store->payments()
            ->latest()
            ->get();

        return response()->json([
            'data' => [
                'store' => [
                    'id' => $store->id,
                    'name' => $store->name,
                    'slug' => $store->slug,
                    'status' => $store->status->value,
                ],
                'subscription' => [
                    'id' => $subscription->id,
                    'package_name' => $subscription->package_name,
                    'package_price' => (float) $subscription->package_price,
                    'package_duration_days' => $subscription->package_duration_days,
                    'status' => $subscription->status->value,
                    'ends_at' => $subscription->ends_at?->toIso8601String(),
                ],
                'payments' => PaymentResource::collection($payments),
            ],
        ]);
    }

    /**
     * Submit a manual payment for the store's pending subscription.
     */
    public function submit(PaymentSubmitRequest $request): JsonResponse
    {
        $user = $request->user();

        assert($user instanceof User);

        $store = $user->store()->firstOrFail();

        /** @var PaymentChannel $channel */
        $channel = PaymentChannel::query()->findOrFail($request->integer('payment_channel_id'));

        $payment = $this->payments->submit($store, $channel, $request->validated());

        return response()->json([
            'data' => new PaymentResource($payment),
        ], 201);
    }
}
