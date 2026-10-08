<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'store_id' => Store::factory(),
            'category_id' => Category::factory(),
            'title' => fake()->unique()->words(3, true),
            'description' => fake()->paragraph(),
            'price' => fake()->randomFloat(2, 5, 500),
            'images' => [],
        ];
    }
}
