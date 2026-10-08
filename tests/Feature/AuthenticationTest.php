<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use CreatesTenants;

    public function test_store_owner_can_login_and_fetch_their_profile(): void
    {
        [, $owner] = $this->makeTenant(activeSubscription: true);

        $response = $this->postJson('/login', [
            'email' => $owner->email,
            'password' => 'password',
        ]);

        $response->assertSuccessful();
        $this->assertAuthenticatedAs($owner);

        $profile = $this->getJson('/api/user');

        $profile->assertOk()
            ->assertJsonPath('data.email', $owner->email)
            ->assertJsonPath('data.role', 'store_owner')
            ->assertJsonPath('data.store.is_operational', true)
            ->assertJsonPath('data.store.subscription.status', 'ACTIVE');
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        [, $owner] = $this->makeTenant();

        $this->postJson('/login', [
            'email' => $owner->email,
            'password' => 'wrong-password',
        ])->assertStatus(422);

        $this->assertGuest();
    }

    public function test_guests_cannot_fetch_the_authenticated_user(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_logout_destroys_the_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        $this->postJson('/logout')->assertSuccessful();

        $this->getJson('/api/user')->assertUnauthorized();
    }
}
