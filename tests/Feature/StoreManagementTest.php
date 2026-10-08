<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class StoreManagementTest extends TestCase
{
    use CreatesTenants;

    public function test_management_can_list_search_and_view_stores(): void
    {
        $this->makeTenant(['name' => 'Alpha Shop']);
        $this->makeTenant(['name' => 'Beta Market']);

        $this->actingAs($this->makeManager());

        $list = $this->getJson('/api/management/stores')->assertOk();
        $this->assertSame(2, $list->json('meta.total'));

        $this->getJson('/api/management/stores?q=alpha')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Alpha Shop');

        $store = Store::query()->where('name', 'Alpha Shop')->firstOrFail();

        $this->getJson('/api/management/stores/'.$store->id)
            ->assertOk()
            ->assertJsonPath('data.name', 'Alpha Shop')
            ->assertJsonPath('data.subscription.status', 'PENDING')
            ->assertJsonCount(1, 'data.owners');
    }

    public function test_management_can_activate_and_deactivate_stores(): void
    {
        [$store] = $this->makeTenant(['name' => 'Toggle Store'], activeSubscription: true);

        $this->actingAs($this->makeManager());

        $this->patchJson('/api/management/stores/'.$store->id.'/status', ['status' => 'INACTIVE'])
            ->assertOk()
            ->assertJsonPath('data.status', 'INACTIVE');

        $this->assertSame('INACTIVE', $store->refresh()->status->value);

        $this->patchJson('/api/management/stores/'.$store->id.'/status', ['status' => 'ACTIVE'])
            ->assertOk()
            ->assertJsonPath('data.status', 'ACTIVE');
    }

    public function test_store_owner_cannot_manage_stores(): void
    {
        [, $owner] = $this->makeTenant();

        $this->actingAs($owner);

        $this->getJson('/api/management/stores')->assertForbidden();
        $this->patchJson('/api/management/stores/1/status', ['status' => 'INACTIVE'])->assertForbidden();
    }

    public function test_store_counts_are_scoped_to_the_store(): void
    {
        [$storeA] = $this->makeTenant(activeSubscription: true);
        [$storeB] = $this->makeTenant(activeSubscription: true);

        $categoryA = Category::factory()->for($storeA)->create();
        Product::factory()->count(3)->for($storeA)->for($categoryA)->create();

        $categoryB = Category::factory()->for($storeB)->create();
        Product::factory()->for($storeB)->for($categoryB)->create();

        $this->actingAs($this->makeManager());

        $payload = $this->getJson('/api/management/stores/'.$storeA->id)->assertOk()->json('data');

        $this->assertSame(1, $payload['categories_count']);
        $this->assertSame(3, $payload['products_count']);
        $this->assertSame(0, $payload['orders_count']);
    }
}
