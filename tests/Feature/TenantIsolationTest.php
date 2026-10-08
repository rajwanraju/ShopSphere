<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use CreatesTenants;

    public function test_store_a_cannot_read_store_b_products_or_categories(): void
    {
        [$storeA, $ownerA] = $this->makeTenant(activeSubscription: true);
        [$storeB] = $this->makeTenant(activeSubscription: true);

        $categoryA = Category::factory()->for($storeA)->create();
        $categoryB = Category::factory()->for($storeB)->create();
        $productB = Product::factory()->for($storeB)->for($categoryB)->create();

        $this->actingAs($ownerA);

        $this->getJson('/api/store/products')->assertOk()
            ->assertJsonCount(0, 'data');

        $this->getJson('/api/store/products/'.$productB->id)->assertForbidden();
        $this->putJson('/api/store/products/'.$productB->id, [
            'title' => 'Hacked',
            'description' => 'Hacked',
            'price' => 1,
            'category_id' => $categoryA->id,
        ])->assertForbidden();
        $this->deleteJson('/api/store/products/'.$productB->id)->assertForbidden();
        $this->assertSame($storeB->id, $productB->refresh()->store_id);
    }

    public function test_store_a_cannot_read_or_modify_store_b_orders(): void
    {
        [, $ownerA] = $this->makeTenant(activeSubscription: true);
        [$storeB, $ownerB] = $this->makeTenant(activeSubscription: true);

        $orderB = Order::factory()->for($storeB)->create();
        $orderB->items()->create([
            'product_id' => null,
            'product_title' => 'B item',
            'product_price' => 10,
            'quantity' => 1,
            'subtotal' => 10,
        ]);

        $this->actingAs($ownerA);

        $this->getJson('/api/store/orders')->assertOk()
            ->assertJsonCount(0, 'data');

        $this->getJson('/api/store/orders/'.$orderB->id)->assertForbidden();
        $this->patchJson('/api/store/orders/'.$orderB->id.'/status', ['status' => 'COMPLETED'])
            ->assertForbidden();

        $this->assertSame('PENDING', $orderB->refresh()->status->value);

        $this->actingAs($ownerB);
        $this->getJson('/api/store/orders/'.$orderB->id)->assertOk()
            ->assertJsonPath('data.order_number', $orderB->order_number);
    }

    public function test_store_a_cannot_modify_store_b_categories(): void
    {
        [, $ownerA] = $this->makeTenant(activeSubscription: true);
        [$storeB] = $this->makeTenant(activeSubscription: true);

        $categoryB = Category::factory()->for($storeB)->create(['title' => 'B category']);

        $this->actingAs($ownerA);

        $this->getJson('/api/store/categories')->assertOk()
            ->assertJsonCount(0, 'data');

        $this->putJson('/api/store/categories/'.$categoryB->id, ['title' => 'Hacked'])->assertForbidden();
        $this->deleteJson('/api/store/categories/'.$categoryB->id)->assertForbidden();
        $this->assertSame('B category', $categoryB->refresh()->title);
    }

    public function test_store_a_cannot_attach_store_b_categories_to_its_products(): void
    {
        [, $ownerA] = $this->makeTenant(activeSubscription: true);
        [$storeB] = $this->makeTenant(activeSubscription: true);

        $categoryB = Category::factory()->for($storeB)->create();

        $this->actingAs($ownerA);

        $this->postJson('/api/store/products', [
            'title' => 'Sneaky product',
            'description' => 'Trying to use another tenant category',
            'price' => 10,
            'category_id' => $categoryB->id,
        ])->assertUnprocessable();
    }

    public function test_store_a_cannot_add_store_b_products_to_its_cart(): void
    {
        [$storeA] = $this->makeTenant(activeSubscription: true);
        [$storeB] = $this->makeTenant(activeSubscription: true);

        $categoryB = Category::factory()->for($storeB)->create();
        $productB = Product::factory()->for($storeB)->for($categoryB)->create();

        $this->postJson("/api/storefront/{$storeA->slug}/cart/items", [
            'product_id' => $productB->id,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('product_id');

        $this->getJson("/api/storefront/{$storeA->slug}/cart")->assertOk()
            ->assertJsonPath('data.count', 0);
    }

    public function test_sales_reports_never_expose_another_stores_data(): void
    {
        [$storeA, $ownerA] = $this->makeTenant(activeSubscription: true);
        [$storeB, $ownerB] = $this->makeTenant(activeSubscription: true);

        $this->seedOrder($storeA, 'Widget', 3, 10.0, 'COMPLETED'); // 30.00
        $this->seedOrder($storeA, 'Gadget', 1, 20.0, 'PENDING'); // 20.00
        $this->seedOrder($storeA, 'Cancelled', 5, 100.0, 'CANCELLED'); // excluded
        $this->seedOrder($storeB, 'Other store product', 9, 111.0, 'COMPLETED'); // 999.00

        $this->actingAs($ownerA);

        $report = $this->getJson('/api/store/reports/sales?days=30')->assertOk()->json('data');

        $this->assertSame(2, $report['orders_count']);
        $this->assertEquals(50.0, $report['revenue']);
        $this->assertNotContains('Other store product', array_column($report['top_products'], 'product_title'));
        $this->assertNotContains('Cancelled', array_column($report['top_products'], 'product_title'));

        $this->actingAs($ownerB);
        $reportB = $this->getJson('/api/store/reports/sales?days=30')->assertOk()->json('data');

        $this->assertSame(1, $reportB['orders_count']);
        $this->assertEquals(999.0, $reportB['revenue']);
    }

    public function test_non_operational_storefronts_are_invisible(): void
    {
        [$inactiveStore] = $this->makeTenant(['status' => 'INACTIVE'], activeSubscription: true);
        [$pendingStore] = $this->makeTenant(activeSubscription: false);

        $this->getJson("/api/storefront/{$inactiveStore->slug}")->assertNotFound();
        $this->getJson("/api/storefront/{$pendingStore->slug}")->assertNotFound();
        $this->getJson("/api/storefront/{$inactiveStore->slug}/products")->assertNotFound();
    }

    public function test_order_confirmations_are_scoped_to_their_store(): void
    {
        [$storeA] = $this->makeTenant(activeSubscription: true);
        [$storeB] = $this->makeTenant(activeSubscription: true);

        $orderA = Order::factory()->for($storeA)->create();

        $this->getJson("/api/storefront/{$storeA->slug}/orders/{$orderA->order_number}")->assertOk();
        $this->getJson("/api/storefront/{$storeB->slug}/orders/{$orderA->order_number}")->assertNotFound();
    }

    /**
     * Seed one order with a single item for the given store.
     */
    private function seedOrder(Store $store, string $title, int $qty, float $price, string $status): Order
    {
        $subtotal = round($price * $qty, 2);

        $order = Order::factory()
            ->for($store)
            ->status($status)
            ->create(['subtotal' => $subtotal, 'total' => $subtotal]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => null,
            'product_title' => $title,
            'product_price' => $price,
            'quantity' => $qty,
            'subtotal' => $subtotal,
        ]);

        return $order;
    }
}
