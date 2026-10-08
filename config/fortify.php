<?php

use Laravel\Fortify\Features;

return [

    'guard' => 'web',

    'passwords' => 'users',

    'username' => 'email',

    'email' => 'email',

    'lowercase_usernames' => true,

    /*
    |--------------------------------------------------------------------------
    | Home Path
    |--------------------------------------------------------------------------
    |
    | Where authenticated users are redirected after login when the request
    | is not an SPA JSON request.
    |
    */

    'home' => '/login',

    'prefix' => '',

    'domain' => null,

    'middleware' => ['web'],

    'limiters' => [
        'login' => 'login',
    ],

    /*
    |--------------------------------------------------------------------------
    | Register View Routes
    |--------------------------------------------------------------------------
    |
    | The frontend is a single-page application; all views are served by the
    | SPA catch-all route, so Fortify only registers the JSON endpoints.
    |
    */

    'views' => false,

    'features' => [
        Features::resetPasswords(),
    ],

];
