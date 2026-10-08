<?php

namespace App\Http\Controllers\Api\Onboarding;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\StoreOnboardingRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\StoreOnboardingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class StoreOnboardingController extends Controller
{
    public function __construct(private StoreOnboardingService $onboarding) {}

    /**
     * Create a store with its owner account and initial pending
     * subscription, then start the owner's session.
     */
    public function store(StoreOnboardingRequest $request): JsonResponse
    {
        $package = $request->selectedPackage();

        $result = $this->onboarding->createStoreWithOwner($package, $request->validated());

        /** @var User $user */
        $user = $result['user'];

        Auth::guard('web')->login($user);

        return response()->json([
            'data' => [
                'store' => [
                    'id' => $result['store']->id,
                    'name' => $result['store']->name,
                    'slug' => $result['store']->slug,
                ],
                'user' => new UserResource($user),
            ],
        ], 201);
    }
}
