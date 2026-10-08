<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class PackageManagementTest extends TestCase
{
    use CreatesTenants;

    public function test_management_can_create_view_update_and_toggle_packages(): void
    {
        $this->actingAs($this->makeManager());

        $created = $this->postJson('/api/management/packages', [
            'name' => 'Business',
            'description' => 'For growing shops',
            'price' => 49.99,
            'duration_days' => 30,
        ])->assertCreated()->json('data');

        $this->assertSame('Business', $created['name']);
        $this->assertTrue($created['is_active']);

        $this->putJson('/api/management/packages/'.$created['id'], [
            'name' => 'Business Pro',
            'description' => 'For growing shops',
            'price' => 59.99,
            'duration_days' => 60,
        ])->assertOk()->assertJsonPath('data.name', 'Business Pro');

        $this->patchJson('/api/management/packages/'.$created['id'].'/status')
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->patchJson('/api/management/packages/'.$created['id'].'/status')
            ->assertOk()
            ->assertJsonPath('data.is_active', true);
    }

    public function test_management_can_delete_a_package(): void
    {
        $this->actingAs($this->makeManager());
        $package = $this->makePackage();

        $this->deleteJson('/api/management/packages/'.$package->id)->assertOk();

        $this->assertDatabaseMissing('packages', ['id' => $package->id]);
    }

    public function test_landing_page_only_lists_active_packages(): void
    {
        $active = $this->makePackage(['name' => 'Starter']);
        $this->makePackage(['name' => 'Hidden', 'is_active' => false]);

        $this->getJson('/api/landing/packages')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', $active->name);
    }

    public function test_landing_cache_round_trips_through_the_hardened_database_store(): void
    {
        // The database store unserializes with allowed_classes: false, so
        // cached payloads must be plain arrays. Miss then hit must match.
        config(['cache.default' => 'database']);

        $this->makePackage(['name' => 'Starter', 'price' => 19]);

        $first = $this->getJson('/api/landing/packages')->assertOk()->json('data');
        $second = $this->getJson('/api/landing/packages')->assertOk()->json('data');

        $this->assertSame($first, $second);
        $this->assertSame('Starter', $second[0]['name']);
        $this->assertEquals(19, $second[0]['price']);
    }

    public function test_package_validation_rules(): void
    {
        $this->actingAs($this->makeManager());

        $this->postJson('/api/management/packages', [
            'name' => '',
            'price' => -5,
            'duration_days' => 0,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'price', 'duration_days']);
    }

    public function test_deleting_a_package_keeps_existing_subscription_snapshots(): void
    {
        [, $owner] = $this->makeTenant(activeSubscription: true);
        $package = $this->makePackage();
        $subscription = $owner->store->subscription;
        $subscription->update(['package_id' => $package->id]);

        $this->actingAs($this->makeManager());
        $this->deleteJson('/api/management/packages/'.$package->id)->assertOk();

        $this->assertDatabaseHas('subscriptions', [
            'id' => $subscription->id,
            'package_name' => $subscription->package_name,
        ]);
        $this->assertNull(DB::table('subscriptions')->find($subscription->id)->package_id);
    }
}
