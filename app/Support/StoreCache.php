<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Centralised cache key management.
 *
 * Tenant-scoped entries embed a per-store version counter, so a single
 * version bump invalidates every cached variant (product filters, report
 * periods, ...) for that store without needing cache tags.
 *
 * IMPORTANT: with the database cache store, Laravel unserializes with
 * `allowed_classes: false` (cache.stores.database.serializable_classes).
 * Only plain arrays/scalars may be cached — never Eloquent models,
 * collections or paginators.
 */
class StoreCache
{
    public const PACKAGES_KEY = 'platform:packages:active';

    public const CHANNELS_KEY = 'platform:payment-channels:active';

    public const DEFAULT_TTL = 600;

    public static function packages(): mixed
    {
        return Cache::get(self::PACKAGES_KEY);
    }

    public static function putPackages(mixed $value): void
    {
        Cache::put(self::PACKAGES_KEY, $value, now()->addHours(6));
    }

    public static function flushPackages(): void
    {
        Cache::forget(self::PACKAGES_KEY);
    }

    public static function paymentChannels(): mixed
    {
        return Cache::get(self::CHANNELS_KEY);
    }

    public static function putPaymentChannels(mixed $value): void
    {
        Cache::put(self::CHANNELS_KEY, $value, now()->addHours(6));
    }

    public static function flushPaymentChannels(): void
    {
        Cache::forget(self::CHANNELS_KEY);
    }

    public static function storeBySlug(string $slug): mixed
    {
        return Cache::get("stores:slug:{$slug}");
    }

    public static function putStoreBySlug(string $slug, mixed $value): void
    {
        Cache::put("stores:slug:{$slug}", $value, now()->addMinutes(5));
    }

    public static function flushStoreBySlug(string $slug): void
    {
        Cache::forget("stores:slug:{$slug}");
    }

    /**
     * Current catalog/sales version for a store.
     */
    public static function version(int $storeId): int
    {
        return (int) Cache::get("stores:{$storeId}:version", 0);
    }

    /**
     * Bump the store version, invalidating every tenant-scoped cached
     * entry for the store (catalog, reports, storefront data).
     */
    public static function bumpVersion(int $storeId): void
    {
        Cache::increment("stores:{$storeId}:version");
    }

    public static function catalogKey(int $storeId, string $suffix): string
    {
        return "stores:{$storeId}:v".self::version($storeId).":{$suffix}";
    }

    /**
     * Remember the value returned by the callback under the given key.
     *
     * @param  (callable(): mixed)  $callback
     */
    public static function remember(string $key, int $ttlSeconds, callable $callback): mixed
    {
        $existing = Cache::get($key);

        if ($existing !== null) {
            return $existing;
        }

        $value = $callback();

        Cache::put($key, $value, now()->addSeconds($ttlSeconds));

        return $value;
    }
}
