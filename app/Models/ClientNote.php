<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientNote extends Model
{
    /** @var list<string> */
    protected $fillable = ['provider_id', 'client_id', 'note_date', 'body'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'note_date' => 'date',
        ];
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /** @param Builder<ClientNote> $query */
    public function scopeForProvider(Builder $query, int $providerId): void
    {
        $query->where('provider_id', $providerId);
    }

    /** @param Builder<ClientNote> $query */
    public function scopeForClient(Builder $query, int $clientId): void
    {
        $query->where('client_id', $clientId);
    }
}
