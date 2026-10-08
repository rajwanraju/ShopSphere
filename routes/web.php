<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Single-page application
|--------------------------------------------------------------------------
|
| The React SPA is served for every non-API path. Authentication
| endpoints (Fortify) are registered by the package and stay session
| based; the API lives under /api.
|
*/

Route::get('/{any}', fn () => view('app'))
    ->where('any', '^(?!api|up$).*$')
    ->name('spa');
