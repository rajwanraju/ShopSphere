<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 20, 900);

        return [
            'store_id' => Store::factory(),
            'order_number' => (string) str()->ulid(),
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'customer_phone' => fake()->phoneNumber(),
            'customer_address' => fake()->address(),
            'status' => 'PENDING',
            'subtotal' => $subtotal,
            'total' => $subtotal,
        ];
    }

    public function status(string $status): static
    {
        return $this->state(fn (): array => ['status' => $status]);
    }
}
