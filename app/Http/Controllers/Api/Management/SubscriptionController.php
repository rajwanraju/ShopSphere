<?php

namespace App\Http\Controllers\Api\Management;

use App\Http\Controllers\Controller;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SubscriptionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SubscriptionResource::collection(
            Subscription::query()
                ->with(['store:id,name,slug,status'])
                ->orderByDesc('created_at')
                ->paginate(15)
        );
    }

    public function show(Subscription $subscription): SubscriptionResource
    {
        $this->authorize('view', $subscription);

        return new SubscriptionResource($subscription->loadMissing(['store:id,name,slug,status', 'payments']));
    }
}
