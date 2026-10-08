<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function view(User $user, Product $product): bool
    {
        return $user->isStoreOwner() && $user->store_id === $product->store_id;
    }

    public function create(User $user): bool
    {
        return $user->isStoreOwner() && $user->store_id !== null;
    }

    public function update(User $user, Product $product): bool
    {
        return $user->isStoreOwner() && $user->store_id === $product->store_id;
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->isStoreOwner() && $user->store_id === $product->store_id;
    }
}
