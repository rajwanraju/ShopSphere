<?php

namespace Tests\Feature;

use App\Models\PaymentChannel;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class PaymentChannelManagementTest extends TestCase
{
    use CreatesTenants;

    public function test_management_can_create_update_toggle_and_delete_channels(): void
    {
        $this->actingAs($this->makeManager());

        $created = $this->postJson('/api/management/payment-channels', [
            'name' => 'City Bank',
            'account_number' => '1234567890',
            'instructions' => 'Use the reference TX id.',
        ])->assertCreated()->json('data');

        $this->assertSame('City Bank', $created['name']);
        $this->assertTrue($created['is_active']);

        $this->putJson('/api/management/payment-channels/'.$created['id'], [
            'name' => 'City Bank UK',
            'account_number' => '0987654321',
        ])->assertOk()
            ->assertJsonPath('data.name', 'City Bank UK')
            ->assertJsonPath('data.account_number', '0987654321');

        $this->patchJson('/api/management/payment-channels/'.$created['id'].'/status')
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->patchJson('/api/management/payment-channels/'.$created['id'].'/status')
            ->assertOk()
            ->assertJsonPath('data.is_active', true);

        $this->deleteJson('/api/management/payment-channels/'.$created['id'])->assertOk();

        $this->assertDatabaseMissing('payment_channels', ['id' => $created['id']]);
    }

    public function test_channel_validation_rules(): void
    {
        $this->actingAs($this->makeManager());

        $this->postJson('/api/management/payment-channels', [
            'name' => '',
            'account_number' => '',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'account_number']);
    }

    public function test_onboarding_only_lists_active_channels(): void
    {
        [, $owner] = $this->makeTenant();
        PaymentChannel::factory()->create(['name' => 'Active Bank']);
        PaymentChannel::factory()->inactive()->create(['name' => 'Hidden Bank']);

        $this->actingAs($owner);

        $channels = $this->getJson('/api/onboarding/payment-channels')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->json('data');

        $this->assertSame('Active Bank', $channels[0]['name']);
    }

    public function test_onboarding_channels_cache_round_trips_through_the_hardened_database_store(): void
    {
        // Miss then hit through the database store (allowed_classes: false)
        // must return identical plain-array payloads.
        config(['cache.default' => 'database']);

        [, $owner] = $this->makeTenant();
        PaymentChannel::factory()->create(['name' => 'Active Bank']);

        $this->actingAs($owner);

        $first = $this->getJson('/api/onboarding/payment-channels')->assertOk()->json('data');
        $second = $this->getJson('/api/onboarding/payment-channels')->assertOk()->json('data');

        $this->assertSame($first, $second);
        $this->assertSame('Active Bank', $second[0]['name']);
    }

    public function test_store_owners_cannot_manage_channels(): void
    {
        [, $owner] = $this->makeTenant();

        $this->actingAs($owner);

        $this->getJson('/api/management/payment-channels')->assertForbidden();
        $this->postJson('/api/management/payment-channels', [
            'name' => 'Nope',
            'account_number' => '1',
        ])->assertForbidden();
    }
}
