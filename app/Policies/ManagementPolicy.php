<?php

namespace App\Policies;

use App\Models\User;

/**
 * Platform management resources (packages, payment channels, stores,
 * subscriptions, payments) are only ever accessible to management users.
 */
abstract class ManagementPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isManagement() ? null : false;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user): bool
    {
        return true;
    }

    public function delete(User $user): bool
    {
        return true;
    }
}
