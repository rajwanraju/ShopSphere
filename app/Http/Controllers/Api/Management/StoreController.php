<?php

namespace App\Http\Controllers\Api\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreStatusRequest;
use App\Http\Resources\StoreResource;
use App\Models\Store;
use App\Support\Enums\StoreStatus;
use App\Support\StoreCache;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class StoreController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Store::query()
            ->with(['subscription', 'users'])
            ->withCount(['categories', 'products', 'orders'])
            ->orderByDesc('created_at');

        $search = trim((string) $request->query('q', ''));

        if ($search !== '') {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%"));
        }

        return StoreResource::collection($query->paginate(15)->withQueryString());
    }

    public function show(Store $store): StoreResource
    {
        $this->authorize('view', $store);

        return new StoreResource(
            $store->load(['subscription', 'users'])
                ->loadCount(['categories', 'products', 'orders'])
        );
    }

    /**
     * Activate or deactivate a store.
     */
    public function updateStatus(StoreStatusRequest $request, Store $store): StoreResource
    {
        $this->authorize('update', $store);

        $store->update(['status' => $request->enum('status', StoreStatus::class)]);

        StoreCache::flushStoreBySlug($store->slug);

        return new StoreResource($store->refresh()->load(['subscription', 'users']));
    }
}
