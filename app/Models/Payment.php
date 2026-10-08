<?php

namespace App\Models;

use App\Support\Enums\PaymentStatus;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $store_id
 * @property int $subscription_id
 * @property int|null $payment_channel_id
 * @property string $channel_name
 * @property string $account_number
 * @property string $transaction_id
 * @property string $amount
 * @property PaymentStatus $status
 * @property string|null $rejection_reason
 * @property int|null $verified_by
 * @property Carbon|null $verified_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    protected $fillable = [
        'store_id',
        'subscription_id',
        'payment_channel_id',
        'channel_name',
        'account_number',
        'transaction_id',
        'amount',
        'status',
        'rejection_reason',
        'verified_by',
        'verified_at',
    ];

    public function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
            'verified_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Store, $this> */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /** @return BelongsTo<Subscription, $this> */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    /** @return BelongsTo<PaymentChannel, $this> */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(PaymentChannel::class, 'payment_channel_id');
    }

    /** @return BelongsTo<User, $this> */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
