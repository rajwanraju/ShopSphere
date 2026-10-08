<?php

namespace App\Services;

use App\Models\Package;
use App\Models\Store;
use App\Models\Subscription;
use App\Models\User;
use App\Support\Enums\StoreStatus;
use App\Support\Enums\SubscriptionStatus;
use App\Support\Enums\UserRole;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StoreOnboardingService
{
    /**
     * Create a store, its owner account and the initial pending
     * subscription in a single transaction.
     *
     * @param  array<string, mixed>  $data
     * @return array{store: Store, user: User}
     */
    public function createStoreWithOwner(Package $package, array $data): array
    {
        return DB::transaction(function () use ($package, $data): array {
            $store = Store::create([
                'name' => $data['store_name'],
                'slug' => $this->uniqueSlug($data['store_name']),
                'description' => $data['store_description'] ?? null,
                'status' => StoreStatus::Active,
            ]);

            $user = User::create([
                'name' => $data['owner_name'],
                'email' => $data['owner_email'],
                'password' => Hash::make($data['owner_password']),
                'role' => UserRole::StoreOwner,
                'store_id' => $store->id,
            ]);

            Subscription::create([
                'store_id' => $store->id,
                'package_id' => $package->id,
                'package_name' => $package->name,
                'package_price' => $package->price,
                'package_duration_days' => $package->duration_days,
                'status' => SubscriptionStatus::Pending,
            ]);

            return ['store' => $store, 'user' => $user];
        });
    }

    /**
     * Generate a URL-safe slug that is guaranteed unique.
     */
    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: Str::lower(Str::random(8));
        $slug = $base;
        $attempt = 1;

        while (Store::where('slug', $slug)->exists()) {
            $slug = $base.'-'.Str::lower(Str::random(4));
            $attempt++;

            if ($attempt > 10) {
                $slug = $base.'-'.Str::lower(Str::random(8));
            }
        }

        return $slug;
    }
}
