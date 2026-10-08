<?php

namespace Tests\Feature;

use App\Models\Payment;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use CreatesTenants;

    public function test_guests_are_rejected_on_protected_api_routes(): void
    {
        $this->getJson('/api/management/packages')->assertUnauthorized();
        $this->getJson('/api/store/products')->assertUnauthorized();
        $this->getJson('/api/onboarding/status')->assertUnauthorized();
    }

    public function test_store_owners_cannot_access_management_routes(): void
    {
        [, $owner] = $this->makeTenant(activeSubscription: true);

        $this->actingAs($owner);

        $this->getJson('/api/management/packages')->assertForbidden();
        $this->getJson('/api/management/stores')->assertForbidden();
        $this->getJson('/api/management/subscriptions')->assertForbidden();
        $this->getJson('/api/management/payments')->assertForbidden();
        $this->getJson('/api/management/payment-channels')->assertForbidden();
    }

    public function test_store_owners_cannot_access_platform_payment_actions(): void
    {
        [, $owner] = $this->makeTenant(activeSubscription: true);
        [$otherStore] = $this->makeTenant();
        $payment = Payment::factory()->create([
            'store_id' => $otherStore->id,
            'subscription_id' => $otherStore->subscription->id,
        ]);

        $this->actingAs($owner);

        $this->postJson('/api/management/payments/'.$payment->id.'/approve')->assertForbidden();
        $this->postJson('/api/management/payments/'.$payment->id.'/reject', ['rejection_reason' => 'nope'])->assertForbidden();
    }

    public function test_management_users_cannot_access_store_admin_routes(): void
    {
        $manager = $this->makeManager();

        $this->actingAs($manager);

        $this->getJson('/api/store/products')->assertForbidden();
        $this->getJson('/api/store/categories')->assertForbidden();
        $this->getJson('/api/store/orders')->assertForbidden();
        $this->getJson('/api/store/reports/sales')->assertForbidden();
    }

    public function test_management_users_cannot_access_onboarding_payment_routes(): void
    {
        $this->actingAs($this->makeManager());

        $this->getJson('/api/onboarding/status')->assertForbidden();
        $this->getJson('/api/onboarding/payment-channels')->assertForbidden();
        $this->postJson('/api/onboarding/payments', [
            'payment_channel_id' => 1,
            'account_number' => '123',
            'transaction_id' => 'TX-1',
        ])->assertForbidden();
    }
}
