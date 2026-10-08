<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Feature\Concerns\CreatesTenants;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use CreatesTenants;

    public function test_owner_can_create_a_product_with_images(): void
    {
        Storage::fake('public');

        [$store, $owner] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();

        $this->actingAs($owner);

        $created = $this->post('/api/store/products', [
            'title' => 'Gaming Mouse',
            'description' => 'Wireless mouse',
            'price' => '29.90',
            'category_id' => $category->id,
            'images' => [UploadedFile::fake()->image('mouse.jpg')],
        ])->assertCreated()->json('data');

        $this->assertSame('Gaming Mouse', $created['title']);
        $this->assertCount(1, $created['images']);
        $this->assertStringContainsString("products/{$store->id}/", $created['images'][0]);

        Storage::disk('public')->assertExists(Product::find($created['id'])->images[0]);
    }

    public function test_owner_can_update_a_product(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();
        $product = Product::factory()->for($store)->for($category)->create([
            'title' => 'Old title',
            'price' => 10,
        ]);

        $this->actingAs($owner);

        $this->getJson('/api/store/products/'.$product->id)->assertOk()
            ->assertJsonPath('data.category.title', $category->title);

        $this->putJson('/api/store/products/'.$product->id, [
            'title' => 'New title',
            'description' => 'Updated',
            'price' => '15.50',
            'category_id' => $category->id,
        ])->assertOk()
            ->assertJsonPath('data.title', 'New title')
            ->assertJsonPath('data.price', 15.5);
    }

    public function test_owner_can_remove_existing_images_on_update(): void
    {
        Storage::fake('public');

        [$store, $owner] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();
        $product = Product::factory()->for($store)->for($category)->create();

        [$kept, $removed] = $this->storeTwoImages($store, $product);
        $product->update(['images' => [$kept, $removed]]);

        $this->actingAs($owner);

        $this->post('/api/store/products/'.$product->id, [
            '_method' => 'PUT',
            'title' => 'Img product',
            'description' => 'd',
            'price' => '10',
            'category_id' => $category->id,
            'existing_images' => [$kept],
        ])->assertOk();

        $this->assertSame([$kept], $product->refresh()->images);
        Storage::disk('public')->assertExists($kept);
        Storage::disk('public')->assertMissing($removed);
    }

    public function test_retained_image_paths_are_validated_against_the_product(): void
    {
        Storage::fake('public');

        [$store, $owner] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();
        $product = Product::factory()->for($store)->for($category)->create();

        [$kept] = $this->storeTwoImages($store, $product);
        $product->update(['images' => [$kept]]);

        $otherStore = Store::factory()->create();
        $foreignPath = "products/{$otherStore->id}/foreign.jpg";
        UploadedFile::fake()->image('foreign.jpg')->storeAs("products/{$otherStore->id}", 'foreign.jpg', 'public');

        $this->actingAs($owner);

        // Foreign paths are dropped; the legitimate kept path survives.
        $this->post('/api/store/products/'.$product->id, [
            '_method' => 'PUT',
            'title' => 'Img product',
            'description' => 'd',
            'price' => '10',
            'category_id' => $category->id,
            'existing_images' => [$kept, $foreignPath],
        ])->assertOk();

        $this->assertSame([$kept], $product->refresh()->images);
        Storage::disk('public')->assertExists($foreignPath);
    }

    public function test_more_than_five_images_are_rejected(): void
    {
        Storage::fake('public');

        [$store, $owner] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();

        $this->actingAs($owner);

        $this->post('/api/store/products', [
            'title' => 'Too many',
            'description' => 'd',
            'price' => '10',
            'category_id' => $category->id,
            'images' => collect(range(1, 6))->map(fn (int $i): UploadedFile => UploadedFile::fake()->image("img{$i}.jpg"))->all(),
        ])->assertUnprocessable();
    }

    public function test_product_validation_rules(): void
    {
        [$store, $owner] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();

        $this->actingAs($owner);

        $this->postJson('/api/store/products', [
            'title' => '',
            'description' => '',
            'price' => -1,
            'category_id' => 0,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'description', 'price', 'category_id']);
    }

    public function test_owner_can_delete_a_product_and_its_images(): void
    {
        Storage::fake('public');

        [$store, $owner] = $this->makeTenant(activeSubscription: true);
        $category = Category::factory()->for($store)->create();
        $product = Product::factory()->for($store)->for($category)->create();

        [$kept] = $this->storeTwoImages($store, $product);
        $product->update(['images' => [$kept]]);

        $this->actingAs($owner);

        $this->deleteJson('/api/store/products/'.$product->id)->assertOk();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
        Storage::disk('public')->assertMissing($kept);
    }

    /**
     * Store two real images for a product and return their paths.
     *
     * @return array{0: string, 1: string}
     */
    private function storeTwoImages(Store $store, Product $product): array
    {
        $paths = [
            UploadedFile::fake()->image('a.jpg')->store("products/{$store->id}", 'public'),
            UploadedFile::fake()->image('b.jpg')->store("products/{$store->id}", 'public'),
        ];

        UploadedFile::fake()->image('a.jpg')->storeAs("products/{$store->id}", basename($paths[0]), 'public');
        UploadedFile::fake()->image('b.jpg')->storeAs("products/{$store->id}", basename($paths[1]), 'public');

        return $paths;
    }
}
