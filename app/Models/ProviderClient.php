<?php

namespace App\Models;

use App\Enums\ProviderClientStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderClient extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'provider_client';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'provider_id',
        'client_id',
        'created_by_provider',
        'status',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'created_by_provider' => 'boolean',
            'status' => ProviderClientStatus::class,
        ];
    }

    /**
     * Get the provider user.
     */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    /**
     * Get the client user.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * Scope to get active relationships.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', ProviderClientStatus::Active);
    }

    /**
     * Scope to get inactive relationships.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('status', ProviderClientStatus::Inactive);
    }

    /**
     * Scope to get relationships for a specific provider.
     */
    public function scopeForProvider(Builder $query, int $providerId): Builder
    {
        return $query->where('provider_id', $providerId);
    }

    /**
     * Scope to get relationships for a specific client.
     */
    public function scopeForClient(Builder $query, int $clientId): Builder
    {
        return $query->where('client_id', $clientId);
    }
}
