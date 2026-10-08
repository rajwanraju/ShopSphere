<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Package;
use App\Models\PaymentChannel;
use App\Models\Product;
use App\Models\Store;
use App\Models\Subscription;
use App\Models\User;
use App\Support\Enums\OrderStatus;
use App\Support\Enums\StoreStatus;
use App\Support\Enums\SubscriptionStatus;
use App\Support\Enums\UserRole;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed a production-shaped demo dataset. Credentials are printed,
     * never hard-coded in source outside this demo seeder.
     */
    public function run(): void
    {
        $management = User::create([
            'name' => 'Platform Manager',
            'email' => 'manager@example.com',
            'password' => Hash::make('Password!123'),
            'role' => UserRole::Management,
        ]);

        $starter = Package::create([
            'name' => 'Starter',
            'description' => 'For small shops getting started online.',
            'price' => 19.00,
            'duration_days' => 30,
            'is_active' => true,
        ]);

        $pro = Package::create([
            'name' => 'Pro',
            'description' => 'Growing stores that need more room.',
            'price' => 49.00,
            'duration_days' => 30,
            'is_active' => true,
        ]);

        PaymentChannel::create([
            'name' => 'Bank Transfer',
            'account_number' => '1234567890',
            'instructions' => 'Transfer the exact package amount and submit your transaction ID below.',
            'is_active' => true,
        ]);

        PaymentChannel::create([
            'name' => 'Mobile Wallet',
            'account_number' => '01712345678',
            'instructions' => 'Send money to this wallet number, then submit the transaction ID.',
            'is_active' => true,
        ]);

        // Demo store with an active subscription, catalog and orders.
        $store = Store::create([
            'name' => 'Demo Store',
            'slug' => 'demo-store',
            'description' => 'A demo storefront seeded with sample products.',
            'status' => StoreStatus::Active,
        ]);

        $owner = User::create([
            'name' => 'Store Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('Password!123'),
            'role' => UserRole::StoreOwner,
            'store_id' => $store->id,
        ]);

        Subscription::create([
            'store_id' => $store->id,
            'package_id' => $pro->id,
            'package_name' => $pro->name,
            'package_price' => $pro->price,
            'package_duration_days' => $pro->duration_days,
            'status' => SubscriptionStatus::Active,
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
        ]);

        $electronics = Category::create(['store_id' => $store->id, 'title' => 'Electronics']);
        $fashion = Category::create(['store_id' => $store->id, 'title' => 'Fashion']);

        $phone = Product::create([
            'store_id' => $store->id,
            'category_id' => $electronics->id,
            'title' => 'Smart Phone X',
            'description' => 'A flagship smartphone with an excellent camera.',
            'price' => 699.00,
            'images' => [],
        ]);

        $headphones = Product::create([
            'store_id' => $store->id,
            'category_id' => $electronics->id,
            'title' => 'Wireless Headphones',
            'description' => 'Noise cancelling over-ear headphones.',
            'price' => 149.00,
            'images' => [],
        ]);

        $tshirt = Product::create([
            'store_id' => $store->id,
            'category_id' => $fashion->id,
            'title' => 'Classic T-Shirt',
            'description' => '100% cotton, comfortable everyday t-shirt.',
            'price' => 19.00,
            'images' => [],
        ]);

        $order = Order::create([
            'store_id' => $store->id,
            'customer_name' => 'Jane Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '01798765432',
            'customer_address' => '42 Sample Street, Springfield',
            'status' => OrderStatus::Completed,
            'subtotal' => 867.00,
            'total' => 867.00,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $phone->id,
            'product_title' => $phone->title,
            'product_price' => $phone->price,
            'quantity' => 1,
            'subtotal' => 699.00,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $tshirt->id,
            'product_title' => $tshirt->title,
            'product_price' => $tshirt->price,
            'quantity' => 1,
            'subtotal' => 19.00,
        ]);

        $order->items()->createMany([
            [
                'product_id' => $headphones->id,
                'product_title' => $headphones->title,
                'product_price' => $headphones->price,
                'quantity' => 1,
                'subtotal' => 149.00,
            ],
        ]);

        $this->command->info('Seeded credentials:');
        $this->command->table(
            ['role', 'email', 'password'],
            [
                ['management', $management->email, 'Password!123'],
                ['store owner ('.$store->slug.')', $owner->email, 'Password!123'],
            ],
        );
    }
}
