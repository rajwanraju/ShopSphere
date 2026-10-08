<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PackageResource;
use App\Models\Package;
use App\Support\StoreCache;
use Illuminate\Http\JsonResponse;

class LandingController extends Controller
{
    /**
     * Active packages shown on the SaaS landing page (cached).
     * Cached payloads are plain arrays — never Eloquent objects.
     */
    public function packages(): JsonResponse
    {
        $packages = StoreCache::packages();

        if (! is_array($packages)) {
            $packages = PackageResource::collection(
                Package::query()
                    ->where('is_active', true)
                    ->orderBy('price')
                    ->get()
            )->resolve();

            StoreCache::putPackages($packages);
        }

        return response()->json([
            'data' => $packages,
        ]);
    }
}
