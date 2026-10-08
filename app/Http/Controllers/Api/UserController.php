<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuthUserResource;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function me(Request $request): AuthUserResource
    {
        return new AuthUserResource($request->user()->loadMissing('store.subscription'));
    }
}
