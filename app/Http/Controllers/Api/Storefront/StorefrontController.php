<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Support\StoreCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class StorefrontController extends Controller
{
    /**
     * Storefront product listing with optional category filter and
     * search, paginated. Results are cached per filter combination.
     * Cached payloads are plain arrays — never Eloquent objects.
     */
    public function products(Request $request, Store $store): JsonResponse
    {
        $categoryId = $request->integer('category_id') ?: null;
        $search = trim((string) $request->query('q', ''));
        $page = max(1, (int) $request->query('page', '1'));

        $cacheKey = StoreCache::catalogKey(
            $store->id,
            'products:'.md5($categoryId.'|'.$search.'|'.$page),
        );

        $cached = StoreCache::remember($cacheKey, 120, function () use ($store, $categoryId, $search): array {
            $query = Product::query()
                ->where('store_id', $store->id)
                ->with('category:id,title')
                ->orderByDesc('created_at');

            if ($categoryId !== null) {
                $query->where('category_id', $categoryId);
            }

            if ($search !== '') {
                $escaped = str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $search);
                $query->where('title', 'like', "%{$escaped}%");
            }

            /** @var LengthAwarePaginator<int, Product> $paginator */
            $paginator = $query->paginate(12)->withQueryString();

            return [
                'items' => ProductResource::collection($paginator->getCollection())->resolve(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'from' => $paginator->firstItem(),
                    'last_page' => $paginator->lastPage(),
                    'per_page' => $paginator->perPage(),
                    'to' => $paginator->lastItem(),
                    'total' => $paginator->total(),
                ],
            ];
        });

        return response()->json([
            'data' => $cached['items'],
            'meta' => $cached['meta'],
        ]);
    }

    /**
     * A single storefront product. Only products of the current store
     * are ever resolvable.
     */
    public function product(Store $store, Product $product): JsonResponse
    {
        abort_unless($product->store_id === $store->id, 404, 'Product not found.');

        $cacheKey = StoreCache::catalogKey($store->id, "products:show:{$product->id}");

        $payload = StoreCache::remember(
            $cacheKey,
            120,
            fn (): array => (new ProductResource($product->load('category:id,title')))->resolve(),
        );

        return response()->json([
            'data' => $payload,
        ]);
    }

    /**
     * Storefront category list (cached as plain arrays).
     */
    public function categories(Store $store): JsonResponse
    {
        $cacheKey = StoreCache::catalogKey($store->id, 'categories');

        $categories = StoreCache::remember(
            $cacheKey,
            300,
            fn (): array => CategoryResource::collection(
                Category::query()
                    ->where('store_id', $store->id)
                    ->orderBy('title')
                    ->get()
            )->resolve(),
        );

        return response()->json([
            'data' => $categories,
        ]);
    }

    /**
     * Public store profile for the storefront chrome.
     */
    public function store(Store $store): JsonResponse
    {
        return response()->json([
            'data' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'description' => $store->description,
            ],
        ]);
    }
}
