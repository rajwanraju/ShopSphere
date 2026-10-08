<?php

namespace App\Http\Controllers\Api\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\PackageRequest;
use App\Http\Resources\PackageResource;
use App\Models\Package;
use App\Support\StoreCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PackageController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return PackageResource::collection(Package::query()->orderBy('price')->get());
    }

    public function store(PackageRequest $request): JsonResponse
    {
        $this->authorize('create', Package::class);

        $package = Package::create($request->validated());

        StoreCache::flushPackages();

        return response()->json(['data' => new PackageResource($package)], 201);
    }

    public function update(PackageRequest $request, Package $package): JsonResponse
    {
        $this->authorize('update', $package);

        $package->update($request->validated());

        StoreCache::flushPackages();

        return response()->json(['data' => new PackageResource($package->refresh())]);
    }

    /**
     * Activate/deactivate a package.
     */
    public function updateStatus(Package $package): JsonResponse
    {
        $this->authorize('update', $package);

        $package->update(['is_active' => ! $package->is_active]);

        StoreCache::flushPackages();

        return response()->json(['data' => new PackageResource($package->refresh())]);
    }

    public function destroy(Package $package): JsonResponse
    {
        $this->authorize('delete', $package);

        $package->delete();

        StoreCache::flushPackages();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
