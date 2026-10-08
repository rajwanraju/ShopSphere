<?php

namespace App\Models;

use Database\Factories\PackageFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string $price
 * @property int $duration_days
 * @property bool $is_active
 */
class Package extends Model
{
    /** @use HasFactory<PackageFactory> */
    use HasFactory;

    protected $fillable = ['name', 'description', 'price', 'duration_days', 'is_active'];

    /** Matches the database default so freshly created instances report correctly. */
    protected $attributes = ['is_active' => true];

    public function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<Subscription, $this> */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
