<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'store_owner',
            'store_id' => null,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the user is a platform management user.
     */
    public function management(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'management',
        ]);
    }

    /**
     * Indicate that the user owns a store.
     */
    public function forStore(int $storeId): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => 'store_owner',
            'store_id' => $storeId,
        ]);
    }
}
