<?php

namespace Database\Factories;

use App\Models\PaymentChannel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PaymentChannel>
 */
class PaymentChannelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company().' Bank',
            'account_number' => fake()->numerify('##########'),
            'instructions' => 'Send the exact amount, then submit your transaction ID.',
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['is_active' => false]);
    }
}
