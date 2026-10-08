<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use CreatesTenants;

    public function test_owner_can_create_update_and_delete_categories(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);

        $this->actingAs($owner);

        $created = $this->postJson('/api/store/categories', ['title' => 'Drinks'])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Drinks')
            ->json('data');

        $this->assertSame($store->id, $created['store_id']);

        $this->putJson('/api/store/categories/'.$created['id'], ['title' => 'Drinks & Juices'])
            ->assertOk()
            ->assertJsonPath('data.title', 'Drinks & Juices');

        $this->deleteJson('/api/store/categories/'.$created['id'])->assertOk();

        $this->assertDatabaseMissing('categories', ['id' => $created['id']]);
    }

    public function test_category_title_is_required_and_unique_per_store(): void
    {
        [, $owner] = $this->makeTenant(activeSubscription: true);

        $this->actingAs($owner);

        $this->postJson('/api/store/categories', ['title' => ''])->assertUnprocessable()
            ->assertJsonValidationErrors('title');

        $this->postJson('/api/store/categories', ['title' => 'Bakery'])->assertCreated();
        $this->postJson('/api/store/categories', ['title' => 'Bakery'])->assertUnprocessable();
    }

    public function test_deleting_a_category_detaches_or_blocks_based_on_products(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);

        $category = Category::factory()->for($store)->create();
        Product::factory()->for($store)->for($category)->create();

        $this->actingAs($owner);

        // The category has products; the API must not orphan them silently.
        $this->deleteJson('/api/store/categories/'.$category->id)
            ->assertUnprocessable()
            ->assertJsonValidationErrors('category');

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }

    public function test_index_includes_product_counts(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);

        $category = Category::factory()->for($store)->create();
        Product::factory()->count(2)->for($store)->for($category)->create();

        $this->actingAs($owner);

        $this->getJson('/api/store/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.products_count', 2);
    }
}
