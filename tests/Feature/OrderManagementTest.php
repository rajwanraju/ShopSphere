<?php

namespace Tests\Feature;

use App\Models\Order;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class OrderManagementTest extends TestCase
{
    use CreatesTenants;

    public function test_owner_lists_only_own_orders(): void
    {
        [, $ownerA] = $this->makeTenant(activeSubscription: true);
        [$storeB, $ownerB] = $this->makeTenant(activeSubscription: true);

        $orderA = Order::factory()->for($storeB)->create();
        $orderB = Order::factory()->for($storeB)->create();

        $this->actingAs($ownerA);
        $this->getJson('/api/store/orders')->assertOk()->assertJsonCount(0, 'data');

        $this->actingAs($ownerB);
        $list = $this->getJson('/api/store/orders')->assertOk()->json('data');

        $this->assertCount(2, $list);
        $this->assertEqualsCanonicalizing(
            [$orderA->id, $orderB->id],
            array_map(static fn (array $order): int => $order['id'], $list),
        );
    }

    public function test_order_listing_can_filter_by_status(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);

        Order::factory()->for($store)->status('PENDING')->create();
        Order::factory()->for($store)->status('COMPLETED')->create();

        $this->actingAs($owner);

        $this->getJson('/api/store/orders?status=COMPLETED')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'COMPLETED');
    }

    public function test_order_detail_includes_items_and_customer(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);

        $order = Order::factory()->for($store)->create([
            'customer_name' => 'Jane Doe',
            'customer_phone' => '+1 555 0100',
            'customer_address' => '1 Main Street',
            'subtotal' => 10,
            'total' => 10,
        ]);

        $order->items()->create([
            'product_id' => null,
            'product_title' => 'Mug',
            'product_price' => 5,
            'quantity' => 2,
            'subtotal' => 10,
        ]);

        $this->actingAs($owner);

        $payload = $this->getJson('/api/store/orders/'.$order->id)->assertOk()->json('data');

        $this->assertSame('Jane Doe', $payload['customer']['name']);
        $this->assertCount(1, $payload['items']);
        $this->assertSame('Mug', $payload['items'][0]['product_title']);
        $this->assertEquals(10.0, $payload['total']);
    }

    public function test_owner_can_update_the_order_status(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);
        $order = Order::factory()->for($store)->status('PENDING')->create();

        $this->actingAs($owner);

        $this->patchJson('/api/store/orders/'.$order->id.'/status', ['status' => 'PROCESSING'])
            ->assertOk()
            ->assertJsonPath('data.status', 'PROCESSING');

        $this->assertSame('PROCESSING', $order->refresh()->status->value);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);
        $order = Order::factory()->for($store)->create();

        $this->actingAs($owner);

        $this->patchJson('/api/store/orders/'.$order->id.'/status', ['status' => 'SHIPPED'])
            ->assertUnprocessable();

        $this->patchJson('/api/store/orders/'.$order->id.'/status', ['status' => 'NOT_A_STATUS'])
            ->assertUnprocessable();
    }

    public function test_sales_report_shape_and_period_scoping(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);

        $old = Order::factory()->for($store)->status('COMPLETED')->create([
            'created_at' => now()->subDays(45),
            'subtotal' => 70,
            'total' => 70,
        ]);
        $old->items()->create([
            'product_id' => null,
            'product_title' => 'Old item',
            'product_price' => 70,
            'quantity' => 1,
            'subtotal' => 70,
        ]);

        $recent = Order::factory()->for($store)->status('COMPLETED')->create([
            'subtotal' => 30,
            'total' => 30,
        ]);
        $recent->items()->create([
            'product_id' => null,
            'product_title' => 'Recent item',
            'product_price' => 15,
            'quantity' => 2,
            'subtotal' => 30,
        ]);

        $this->actingAs($owner);

        $report7 = $this->getJson('/api/store/reports/sales?days=7')->assertOk()->json('data');
        $this->assertSame(7, $report7['period_days']);
        $this->assertSame(1, $report7['orders_count']);
        $this->assertEquals(30.0, $report7['revenue']);
        $this->assertSame('Recent item', $report7['top_products'][0]['product_title']);
        $this->assertSame(2, $report7['top_products'][0]['quantity_sold']);

        $report90 = $this->getJson('/api/store/reports/sales?days=90')->assertOk()->json('data');
        $this->assertSame(2, $report90['orders_count']);
        $this->assertEquals(100.0, $report90['revenue']);
    }
}
