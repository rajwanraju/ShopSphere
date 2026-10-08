<?php

namespace App\Http\Middleware;

use App\Models\Store;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStorefrontAvailable
{
    /**
     * A storefront is only publicly reachable when its store is ACTIVE
     * and its subscription is valid. Non-operational storefronts return
     * 404 so their existence is not disclosed.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $store = $request->route('store');

        if (! $store instanceof Store || ! $store->isOperational()) {
            abort(404, 'Storefront not found.');
        }

        return $next($request);
    }
}
