<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class StorefrontShoppingTest extends TestCase
{
    use CreatesTenants;

    public function test_storefront_exposes_store_categories_and_products(): void
    {
        [$store] = $this->makeTenant(activeSubscription: true);

        $category = Category::factory()->for($store)->create();
        Product::factory()->for($store)->for($category)->create(['title' => 'Coffee Beans', 'price' => 12.5]);
        Product::factory()->for($store)->for($category)->create(['title' => 'Green Tea', 'price' => 8]);

        $this->getJson("/api/storefront/{$store->slug}")->assertOk()
            ->assertJsonPath('data.name', $store->name);

        $this->getJson("/api/storefront/{$store->slug}/categories")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $products = $this->getJson("/api/storefront/{$store->slug}/products")
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->json('data');

        $this->assertCount(2, $products);
        $this->assertArrayHasKey('images', $products[0]);

        $found = $this->getJson("/api/storefront/{$store->slug}/products?q=coffee")
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->json('data.0');

        $this->assertSame('Coffee Beans', $found['title']);
    }

    public function test_cart_add_update_remove_and_totals(): void
    {
        [$store] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();
        $productA = Product::factory()->for($store)->for($category)->create(['price' => 10]);
        $productB = Product::factory()->for($store)->for($category)->create(['price' => 2.5]);

        $this->postJson("/api/storefront/{$store->slug}/cart/items", [
            'product_id' => $productA->id,
            'quantity' => 2,
        ])->assertOk()->assertJsonPath('data.count', 2);

        $this->postJson("/api/storefront/{$store->slug}/cart/items", [
            'product_id' => $productB->id,
        ])->assertOk()->assertJsonPath('data.count', 3);

        $cart = $this->getJson("/api/storefront/{$store->slug}/cart")->assertOk()->json('data');
        $this->assertEquals(22.5, $cart['subtotal']);

        $this->patchJson("/api/storefront/{$store->slug}/cart/items/{$productA->id}", [
            'quantity' => 1,
        ])->assertOk()->assertJsonPath('data.count', 2);

        $cart = $this->getJson("/api/storefront/{$store->slug}/cart")->assertOk()->json('data');
        $this->assertEquals(12.5, $cart['subtotal']);

        $this->deleteJson("/api/storefront/{$store->slug}/cart/items/{$productB->id}")
            ->assertOk()
            ->assertJsonPath('data.count', 1);

        $this->deleteJson("/api/storefront/{$store->slug}/cart")
            ->assertOk()
            ->assertJsonPath('data.count', 0);
    }

    public function test_cart_quantities_are_capped_and_validated(): void
    {
        [$store] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();
        $product = Product::factory()->for($store)->for($category)->create();

        $this->postJson("/api/storefront/{$store->slug}/cart/items", [
            'product_id' => $product->id,
            'quantity' => 0,
        ])->assertUnprocessable();

        $this->postJson("/api/storefront/{$store->slug}/cart/items", [
            'product_id' => $product->id,
            'quantity' => 200,
        ])->assertUnprocessable();
    }

    public function test_checkout_creates_an_order_and_clears_the_cart(): void
    {
        [$store] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();
        $productA = Product::factory()->for($store)->for($category)->create(['title' => 'Mug', 'price' => 5]);
        $productB = Product::factory()->for($store)->for($category)->create(['title' => 'Plate', 'price' => 7.5]);

        $this->postJson("/api/storefront/{$store->slug}/cart/items", [
            'product_id' => $productA->id,
            'quantity' => 2,
        ])->assertOk();
        $this->postJson("/api/storefront/{$store->slug}/cart/items", [
            'product_id' => $productB->id,
            'quantity' => 1,
        ])->assertOk();

        $order = $this->postJson("/api/storefront/{$store->slug}/checkout", [
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '+1 555 0100',
            'customer_address' => '1 Main Street',
        ])->assertCreated()->json('data');

        $this->assertSame('Jane Doe', $order['customer']['name']);
        $this->assertEquals(17.5, $order['total']);
        $this->assertCount(2, $order['items']);
        $this->assertNotNull($order['order_number']);

        $this->assertDatabaseHas('orders', [
            'id' => $order['id'],
            'store_id' => $store->id,
            'status' => 'PENDING',
        ]);

        // Cart is emptied after checkout.
        $this->getJson("/api/storefront/{$store->slug}/cart")->assertOk()
            ->assertJsonPath('data.count', 0);

        // The order confirmation is publicly retrievable by order number.
        $this->getJson("/api/storefront/{$store->slug}/orders/{$order['order_number']}")
            ->assertOk()
            ->assertJsonPath('data.id', $order['id']);
    }

    public function test_checkout_requires_customer_information_and_a_non_empty_cart(): void
    {
        [$store] = $this->makeTenant(activeSubscription: true);

        $this->postJson("/api/storefront/{$store->slug}/checkout", [
            'customer_name' => 'Jane Doe',
            'customer_phone' => '+1 555 0100',
            'customer_address' => '1 Main Street',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('cart');

        $this->postJson("/api/storefront/{$store->slug}/checkout", [
            'customer_name' => '',
            'customer_phone' => '',
            'customer_address' => '',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['customer_name', 'customer_phone', 'customer_address']);
    }

    public function test_order_number_confirms_store_scoping(): void
    {
        [$storeA] = $this->makeTenant(activeSubscription: true);
        [$storeB] = $this->makeTenant(activeSubscription: true);
        $categoryA = Category::factory()->for($storeA)->create();
        $product = Product::factory()->for($storeA)->for($categoryA)->create();

        $this->postJson("/api/storefront/{$storeA->slug}/cart/items", ['product_id' => $product->id])->assertOk();

        $order = $this->postJson("/api/storefront/{$storeA->slug}/checkout", [
            'customer_name' => 'Jane Doe',
            'customer_phone' => '+1 555 0100',
            'customer_address' => '1 Main Street',
        ])->assertCreated()->json('data');

        $this->getJson("/api/storefront/{$storeB->slug}/orders/{$order['order_number']}")->assertNotFound();
        $this->assertDatabaseHas('orders', ['id' => $order['id']]);
    }
}
