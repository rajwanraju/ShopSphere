<?php

namespace Tests\Feature;

use App\Models\Package;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Subscription;
use App\Models\User;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class PaymentWorkflowTest extends TestCase
{
    use CreatesTenants;

    public function test_full_flow_onboarding_payment_approval_and_activation(): void
    {
        $package = $this->makePackage(['name' => 'Starter', 'price' => 25.5, 'duration_days' => 30]);
        $channel = PaymentChannel::factory()->create();

        // 1. Landing: package is publicly visible.
        $this->getJson('/api/landing/packages')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Starter');

        // 2. Public store creation creates store + owner + pending subscription.
        $onboarded = $this->postJson('/api/onboarding/stores', [
            'package_id' => $package->id,
            'store_name' => 'Flow Shop',
            'store_description' => 'Flow test',
            'owner_name' => 'Flow Owner',
            'owner_email' => 'flow@example.com',
            'owner_password' => 'Password!123',
            'owner_password_confirmation' => 'Password!123',
        ]);

        $onboarded->assertCreated();
        $storeId = $onboarded->json('data.store.id');
        $slug = $onboarded->json('data.store.slug');
        $this->assertAuthenticated();

        $owner = User::where('email', 'flow@example.com')->firstOrFail();

        // 3. Storefront is not reachable while the subscription is pending.
        $this->getJson("/api/storefront/{$slug}")->assertNotFound();

        // 4. Owner submits a manual payment; amount is snapshotted from the package.
        $this->actingAs($owner);

        $payment = $this->postJson('/api/onboarding/payments', [
            'payment_channel_id' => $channel->id,
            'account_number' => 'ACC-1',
            'transaction_id' => 'TX-100',
        ])->assertCreated()->json('data');

        $this->assertSame('PENDING', $payment['status']);
        $this->assertEquals(25.5, $payment['amount']);
        $this->assertSame($channel->name, $payment['channel_name']);

        // 5. Management sees the pending payment and approves it.
        $manager = $this->makeManager();

        $this->actingAs($manager);

        $this->getJson('/api/management/payments?status=PENDING')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->postJson('/api/management/payments/'.$payment['id'].'/approve')->assertOk();

        // 6. The subscription became active with the package duration.
        $this->assertDatabaseHas('subscriptions', [
            'store_id' => $storeId,
            'status' => 'ACTIVE',
        ]);

        $subscription = Subscription::where('store_id', $storeId)->firstOrFail();
        $this->assertNotNull($subscription->starts_at);
        $this->assertTrue(now()->addDays(30)->startOfDay()->equalTo($subscription->ends_at->copy()->startOfDay()));

        $this->assertDatabaseHas('payments', [
            'id' => $payment['id'],
            'status' => 'APPROVED',
            'verified_by' => $manager->id,
        ]);

        // 7. The store became operational: storefront + admin panel work.
        $this->getJson("/api/storefront/{$slug}")->assertOk();

        $this->actingAs($owner);
        $this->getJson('/api/user')->assertOk()->assertJsonPath('data.store.is_operational', true);
        $this->getJson('/api/store/products')->assertOk();
    }

    public function test_rejected_payment_keeps_the_subscription_inactive(): void
    {
        [$store, $owner] = $this->makeTenant();
        $channel = PaymentChannel::factory()->create();

        $this->actingAs($owner);
        $payment = $this->postJson('/api/onboarding/payments', [
            'payment_channel_id' => $channel->id,
            'account_number' => 'ACC-2',
            'transaction_id' => 'TX-200',
        ])->assertCreated()->json('data');

        $this->actingAs($this->makeManager());

        $this->postJson('/api/management/payments/'.$payment['id'].'/reject', [
            'rejection_reason' => 'Transaction not found at the bank.',
        ])->assertOk()
            ->assertJsonPath('data.status', 'REJECTED')
            ->assertJsonPath('data.rejection_reason', 'Transaction not found at the bank.');

        $this->assertDatabaseHas('subscriptions', [
            'id' => $store->subscription->id,
            'status' => 'PENDING',
        ]);

        // Storefront stays unreachable after a rejection.
        $this->getJson("/api/storefront/{$store->slug}")->assertNotFound();

        // The owner sees the rejection in onboarding status.
        $this->actingAs($owner);
        $status = $this->getJson('/api/onboarding/status')->assertOk()->json('data');

        $this->assertSame('PENDING', $status['subscription']['status']);
        $this->assertSame('REJECTED', $status['payments'][0]['status']);
    }

    public function test_rejection_requires_a_reason(): void
    {
        $this->actingAs($this->makeManager());
        $payment = $this->makePayment();

        $this->postJson('/api/management/payments/'.$payment->id.'/reject', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('rejection_reason');
    }

    public function test_a_payment_can_only_be_processed_once(): void
    {
        $this->actingAs($this->makeManager());
        $payment = $this->makePayment();

        $this->postJson('/api/management/payments/'.$payment->id.'/approve')->assertOk();

        $this->postJson('/api/management/payments/'.$payment->id.'/approve')
            ->assertUnprocessable();
        $this->postJson('/api/management/payments/'.$payment->id.'/reject', [
            'rejection_reason' => 'Too late.',
        ])->assertUnprocessable();
    }

    public function test_payments_cannot_be_submitted_for_an_active_subscription(): void
    {
        [, $owner] = $this->makeTenant(activeSubscription: true);
        $channel = PaymentChannel::factory()->create();

        $this->actingAs($owner);

        $this->postJson('/api/onboarding/payments', [
            'payment_channel_id' => $channel->id,
            'account_number' => 'ACC-3',
            'transaction_id' => 'TX-300',
        ])->assertUnprocessable();
    }

    public function test_unknown_payment_channel_is_rejected(): void
    {
        [, $owner] = $this->makeTenant();

        $this->actingAs($owner);

        $this->postJson('/api/onboarding/payments', [
            'payment_channel_id' => 999999,
            'account_number' => 'ACC-4',
            'transaction_id' => 'TX-400',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('payment_channel_id');
    }

    /**
     * Create a pending payment for a random tenant.
     */
    private function makePayment(): Payment
    {
        [$store] = $this->makeTenant();
        $channel = PaymentChannel::factory()->create();

        return Payment::create([
            'store_id' => $store->id,
            'subscription_id' => $store->subscription->id,
            'payment_channel_id' => $channel->id,
            'channel_name' => $channel->name,
            'account_number' => 'ACC-0',
            'transaction_id' => 'TX-0',
            'amount' => $store->subscription->package_price,
            'status' => 'PENDING',
        ]);
    }
}
