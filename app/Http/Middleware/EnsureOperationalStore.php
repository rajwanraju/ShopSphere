<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOperationalStore
{
    /**
     * Store admin operations require an ACTIVE store with an active
     * subscription. The reason is exposed so the SPA can route the
     * owner into onboarding when the subscription is not active yet.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(403, 'No store is associated with your account.');
        }

        $store = $user->store()->first();

        if ($store === null) {
            abort(403, 'No store is associated with your account.');
        }

        if ($store->status->value === 'INACTIVE') {
            abort(403, 'Your store has been deactivated by the platform.');
        }

        $subscription = $store->subscription;

        if ($subscription === null || ! $subscription->isActive()) {
            abort(403, 'Your store subscription is not active.', [
                'code' => 'SUBSCRIPTION_INACTIVE',
            ]);
        }

        $request->attributes->set('store', $store);

        return $next($request);
    }
}
