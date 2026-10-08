<?php

namespace Tests\Feature\Concerns;

use App\Models\Package;
use App\Models\Store;
use App\Models\Subscription;
use App\Models\User;

/**
 * Shared factory helpers for building isolated tenants.
 */
trait CreatesTenants
{
    /**
     * Create a store with one owner and a subscription.
     *
     * @param  array<string, mixed>  $storeState
     * @param  array<string, mixed>  $subscriptionState
     * @return array{0: Store, 1: User}
     */
    protected function makeTenant(array $storeState = [], array $subscriptionState = [], bool $activeSubscription = false): array
    {
        $store = Store::factory()->state($storeState)->create();

        $subscription = Subscription::factory();

        if ($activeSubscription) {
            $subscription = $subscription->active();
        }

        $subscription->create(['store_id' => $store->id] + $subscriptionState);

        $owner = User::factory()->forStore($store->id)->create();

        return [$store, $owner];
    }

    /**
     * Create a platform management user.
     */
    protected function makeManager(): User
    {
        return User::factory()->management()->create();
    }

    /**
     * Create a package.
     *
     * @param  array<string, mixed>  $state
     */
    protected function makePackage(array $state = []): Package
    {
        return Package::factory()->state($state)->create();
    }
}
