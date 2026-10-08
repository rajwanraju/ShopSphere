<?php

use App\Http\Controllers\Api\LandingController;
use App\Http\Controllers\Api\Management\PackageController;
use App\Http\Controllers\Api\Management\PaymentChannelController;
use App\Http\Controllers\Api\Management\PaymentController;
use App\Http\Controllers\Api\Management\StoreController;
use App\Http\Controllers\Api\Management\SubscriptionController;
use App\Http\Controllers\Api\Onboarding\OnboardingPaymentController;
use App\Http\Controllers\Api\Onboarding\StoreOnboardingController;
use App\Http\Controllers\Api\StoreAdmin\CategoryController;
use App\Http\Controllers\Api\StoreAdmin\OrderController;
use App\Http\Controllers\Api\StoreAdmin\ProductController;
use App\Http\Controllers\Api\StoreAdmin\ReportController;
use App\Http\Controllers\Api\Storefront\CartController;
use App\Http\Controllers\Api\Storefront\CheckoutController;
use App\Http\Controllers\Api\Storefront\StorefrontController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:api')->group(function (): void {

    /*
    |----------------------------------------------------------------------
    | Authenticated session user
    |----------------------------------------------------------------------
    */
    Route::get('/user', [UserController::class, 'me'])
        ->middleware('auth:sanctum');

    /*
    |----------------------------------------------------------------------
    | SaaS landing (public)
    |----------------------------------------------------------------------
    */
    Route::get('/landing/packages', [LandingController::class, 'packages']);

    /*
    |----------------------------------------------------------------------
    | Store onboarding (public): store + owner account creation
    |----------------------------------------------------------------------
    */
    Route::post('/onboarding/stores', [StoreOnboardingController::class, 'store'])
        ->middleware('throttle:onboarding');

    /*
    |----------------------------------------------------------------------
    | Store onboarding (authenticated store owner): manual payment
    |----------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'role:store_owner'])->prefix('onboarding')->group(function (): void {
        Route::get('/payment-channels', [OnboardingPaymentController::class, 'channels']);
        Route::get('/status', [OnboardingPaymentController::class, 'status']);
        Route::post('/payments', [OnboardingPaymentController::class, 'submit'])
            ->middleware('throttle:onboarding');
    });

    /*
    |----------------------------------------------------------------------
    | Storefront (public, per-store tenant scope)
    |----------------------------------------------------------------------
    */
    Route::middleware(['storefront.available', 'throttle:storefront'])
        ->prefix('storefront/{store:slug}')->scopeBindings()->group(function (): void {
            Route::get('/', [StorefrontController::class, 'store']);
            Route::get('/categories', [StorefrontController::class, 'categories']);
            Route::get('/products', [StorefrontController::class, 'products']);
            Route::get('/products/{product}', [StorefrontController::class, 'product']);
            Route::get('/cart', [CartController::class, 'index']);
            Route::post('/cart/items', [CartController::class, 'add']);
            Route::patch('/cart/items/{product}', [CartController::class, 'update']);
            Route::delete('/cart/items/{product}', [CartController::class, 'remove']);
            Route::delete('/cart', [CartController::class, 'clear']);
            Route::post('/checkout', [CheckoutController::class, 'store'])
                ->middleware('throttle:checkout');
            Route::get('/orders/{orderNumber}', [CheckoutController::class, 'confirmation']);
        });

    /*
    |----------------------------------------------------------------------
    | Store admin (authenticated store owner, operational store only)
    |----------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'role:store_owner', 'store.operational'])
        ->prefix('store')->group(function (): void {
            Route::apiResource('categories', CategoryController::class)
                ->only(['index', 'store', 'update', 'destroy']);

            Route::apiResource('products', ProductController::class)
                ->only(['index', 'show', 'store', 'update', 'destroy']);

            Route::get('orders', [OrderController::class, 'index']);
            Route::get('orders/{order}', [OrderController::class, 'show']);
            Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);

            Route::get('reports/sales', [ReportController::class, 'sales']);
        });

    /*
    |----------------------------------------------------------------------
    | Platform management (management users only)
    |----------------------------------------------------------------------
    */
    Route::middleware(['auth:sanctum', 'role:management'])
        ->prefix('management')->group(function (): void {
            Route::apiResource('packages', PackageController::class)
                ->only(['index', 'store', 'update', 'destroy']);
            Route::patch('packages/{package}/status', [PackageController::class, 'updateStatus']);

            Route::get('stores', [StoreController::class, 'index']);
            Route::get('stores/{store}', [StoreController::class, 'show']);
            Route::patch('stores/{store}/status', [StoreController::class, 'updateStatus']);

            Route::get('subscriptions', [SubscriptionController::class, 'index']);
            Route::get('subscriptions/{subscription}', [SubscriptionController::class, 'show']);

            Route::get('payments', [PaymentController::class, 'index']);
            Route::get('payments/{payment}', [PaymentController::class, 'show']);
            Route::post('payments/{payment}/approve', [PaymentController::class, 'approve']);
            Route::post('payments/{payment}/reject', [PaymentController::class, 'reject']);

            Route::apiResource('payment-channels', PaymentChannelController::class)
                ->only(['index', 'store', 'update', 'destroy']);
            Route::patch('payment-channels/{payment_channel}/status', [PaymentChannelController::class, 'updateStatus']);
        });
});
