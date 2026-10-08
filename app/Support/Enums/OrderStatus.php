<?php

namespace App\Support\Enums;

enum OrderStatus: string
{
    case Pending = 'PENDING';
    case Processing = 'PROCESSING';
    case Completed = 'COMPLETED';
    case Cancelled = 'CANCELLED';
}
