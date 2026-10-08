<?php

namespace Database\Factories;

use App\Models\Package;
use App\Models\Store;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subscription>
 */
class SubscriptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'store_id' => Store::factory(),
            'package_id' => Package::factory(),
            'package_name' => 'Starter',
            'package_price' => 19.00,
            'package_duration_days' => 30,
            'status' => 'PENDING',
            'starts_at' => null,
            'ends_at' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (): array => [
            'status' => 'ACTIVE',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
        ]);
    }
}
