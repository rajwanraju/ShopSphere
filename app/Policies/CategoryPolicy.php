<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function view(User $user, Category $category): bool
    {
        return $user->isStoreOwner() && $user->store_id === $category->store_id;
    }

    public function create(User $user): bool
    {
        return $user->isStoreOwner() && $user->store_id !== null;
    }

    public function update(User $user, Category $category): bool
    {
        return $user->isStoreOwner() && $user->store_id === $category->store_id;
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->isStoreOwner() && $user->store_id === $category->store_id;
    }
}
