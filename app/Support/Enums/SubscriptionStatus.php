<?php

namespace App\Support\Enums;

enum SubscriptionStatus: string
{
    case Pending = 'PENDING';
    case Active = 'ACTIVE';
    case Expired = 'EXPIRED';
    case Cancelled = 'CANCELLED';
}
