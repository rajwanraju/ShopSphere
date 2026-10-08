<?php

namespace App\Support\Enums;

enum UserRole: string
{
    case Management = 'management';
    case StoreOwner = 'store_owner';
}
