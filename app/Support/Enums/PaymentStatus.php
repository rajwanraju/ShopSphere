<?php

namespace App\Support\Enums;

enum PaymentStatus: string
{
    case Pending = 'PENDING';
    case Approved = 'APPROVED';
    case Rejected = 'REJECTED';
}
