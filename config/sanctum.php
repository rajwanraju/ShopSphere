<?php

use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Laravel\Sanctum\Http\Middleware\AuthenticateSession;
use Laravel\Sanctum\Sanctum;

return [

    /*
    |----------------------------------------------------------------------
    | Stateful Domains
    |----------------------------------------------------------------------
    |
    | Requests whose referer/origin matches one of these domains receive
    | stateful SPA session cookies. The SPA is served from the same
    | origin as the API, but `php artisan serve` and Vite dev servers
    | bind to arbitrary ports, and Sanctum matches the referer including
    | the port — so every origin the SPA may be browsed from during
    | development is listed. Set SANCTUM_STATEFUL_DOMAINS in production
    | to exactly the deployed SPA origin.
    |
    */

    'stateful' => explode(',', (string) env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,127.0.0.1,::1,'
            .'localhost:3000,127.0.0.1:3000,'
            .'localhost:5173,127.0.0.1:5173,'
            .'localhost:8000,127.0.0.1:8000,'
            .'localhost:8001,127.0.0.1:8001,',
        Sanctum::currentApplicationUrlWithPort(),
    ))),

    /*
    |----------------------------------------------------------------------
    | Sanctum Guards
    |----------------------------------------------------------------------
    */

    'guard' => ['web'],

    /*
    |----------------------------------------------------------------------
    | Expiration Minutes
    |----------------------------------------------------------------------
    */

    'expiration' => null,

    /*
    |----------------------------------------------------------------------
    | Token Prefix
    |----------------------------------------------------------------------
    */

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    /*
    |----------------------------------------------------------------------
    | Sanctum Middleware
    |----------------------------------------------------------------------
    */

    'middleware' => [
        'authenticate_session' => AuthenticateSession::class,
        'encrypt_cookies' => EncryptCookies::class,
        'validate_csrf_token' => ValidateCsrfToken::class,
    ],

];
