<?php

namespace App\Models;

use Database\Factories\PaymentChannelFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $account_number
 * @property string|null $instructions
 * @property bool $is_active
 */
class PaymentChannel extends Model
{
    /** @use HasFactory<PaymentChannelFactory> */
    use HasFactory;

    protected $fillable = ['name', 'account_number', 'instructions', 'is_active'];

    /** Matches the database default so freshly created instances report correctly. */
    protected $attributes = ['is_active' => true];

    public function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
