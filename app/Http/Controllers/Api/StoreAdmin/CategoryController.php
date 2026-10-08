<?php

namespace App\Http\Controllers\Api\StoreAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdmin\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\Store;
use App\Models\User;
use App\Support\StoreCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    /**
     * List the current store's categories.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $store = $this->storeFrom($request);

        $categories = Category::query()
            ->where('store_id', $store->id)
            ->withCount('products')
            ->orderBy('title')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $this->authorize('create', Category::class);

        $store = $this->storeFrom($request);

        $category = Category::create([
            'store_id' => $store->id,
            'title' => $request->validated('title'),
        ]);

        StoreCache::bumpVersion($store->id);

        return response()->json([
            'data' => new CategoryResource($category),
        ], 201);
    }

    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $this->authorize('update', $category);

        $category->update($request->validated());

        StoreCache::bumpVersion($category->store_id);

        return response()->json([
            'data' => new CategoryResource($category->refresh()),
        ]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        if ($category->products()->exists()) {
            throw ValidationException::withMessages([
                'category' => 'Move or delete the products in this category first.',
            ]);
        }

        $storeId = $category->store_id;
        $category->delete();

        StoreCache::bumpVersion($storeId);

        return response()->json(['data' => ['deleted' => true]]);
    }

    private function storeFrom(Request $request): Store
    {
        $user = $request->user();

        assert($user instanceof User);

        $store = $user->store()->firstOrFail();

        return $store;
    }
}
