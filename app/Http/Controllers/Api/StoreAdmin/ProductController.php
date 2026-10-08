<?php

namespace App\Http\Controllers\Api\StoreAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdmin\ProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use App\Services\ImageUploadService;
use App\Support\StoreCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function __construct(private ImageUploadService $images) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $store = $this->storeFrom($request);

        $query = Product::query()
            ->where('store_id', $store->id)
            ->with('category:id,title')
            ->orderByDesc('created_at');

        if ($request->filled('category_id')) {
            $query->where('category_id', (int) $request->query('category_id'));
        }

        if ($request->filled('q')) {
            $search = str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], trim((string) $request->query('q')));
            $query->where('title', 'like', "%{$search}%");
        }

        return ProductResource::collection($query->paginate(15)->withQueryString());
    }

    public function store(ProductRequest $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $store = $this->storeFrom($request);
        $validated = $request->validated();

        /** @var Product $product */
        $product = DB::transaction(function () use ($request, $store, $validated): Product {
            $imagePaths = $this->images->storeProductImages($request->file('images', []), $store->id);

            return Product::create([
                ...collect($validated)->except(['images', 'existing_images'])->all(),
                'store_id' => $store->id,
                'images' => $imagePaths,
            ]);
        });

        StoreCache::bumpVersion($store->id);

        return response()->json([
            'data' => new ProductResource($product->load('category:id,title')),
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        return response()->json([
            'data' => new ProductResource($product->load('category:id,title')),
        ]);
    }

    public function update(ProductRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $validated = $request->validated();

        DB::transaction(function () use ($request, $product, $validated): void {
            $retained = $this->images->filterRetained($product, (array) $request->input('existing_images', []));
            $removed = collect($product->images ?? [])->reject(fn (string $path): bool => in_array($path, $retained, true))->all();

            $merged = $this->images->mergeImages($retained, $request->file('images', []), $product->store_id);

            $product->update([
                ...collect($validated)->except(['images', 'existing_images'])->all(),
                'images' => $merged,
            ]);

            $this->images->deleteImages($removed);
        });

        StoreCache::bumpVersion($product->store_id);

        return response()->json([
            'data' => new ProductResource($product->refresh()->load('category:id,title')),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', $product);

        DB::transaction(function () use ($product): void {
            $images = $product->images ?? [];
            $storeId = $product->store_id;

            $product->delete();

            $this->images->deleteImages($images);
            StoreCache::bumpVersion($storeId);
        });

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
