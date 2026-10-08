<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Store;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        $store = Store::factory()->has(Subscription::factory())->create();

        return [
            'store_id' => $store->id,
            'subscription_id' => $store->subscription->id,
            'payment_channel_id' => PaymentChannel::factory(),
            'channel_name' => 'Test Bank',
            'account_number' => fake()->numerify('##########'),
            'transaction_id' => 'TX-'.fake()->unique()->numerify('######'),
            'amount' => 19.0,
            'status' => 'PENDING',
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (): array => ['status' => 'APPROVED']);
    }

    public function rejected(): static
    {
        return $this->state(fn (): array => ['status' => 'REJECTED', 'rejection_reason' => 'Not verified.']);
    }
}
