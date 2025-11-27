<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Timeslot extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'provider_id',
        'client_id',
        'start_time',
        'duration_minutes',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_time' => 'datetime',
        'duration_minutes' => 'integer',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<string>
     */
    protected $appends = [
        'end_time',
        'is_available',
        'is_booked',
        'is_cancelled',
        'is_completed',
    ];

    /**
     * Get the provider (user) who created this timeslot.
     */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    /**
     * Get the client (user) who booked this timeslot.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * Scope a query to only include available timeslots.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available')
            ->where('start_time', '>', now());
    }

    /**
     * Scope a query to only include booked timeslots.
     */
    public function scopeBooked($query)
    {
        return $query->where('status', 'booked');
    }

    /**
     * Scope a query to only include cancelled timeslots.
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope a query to only include completed timeslots.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope a query to only include future timeslots.
     */
    public function scopeFuture($query)
    {
        return $query->where('start_time', '>', now());
    }

    /**
     * Scope a query to only include timeslots for a specific provider.
     */
    public function scopeForProvider($query, int $providerId)
    {
        return $query->where('provider_id', $providerId);
    }

    /**
     * Scope a query to only include timeslots for a specific client.
     */
    public function scopeForClient($query, int $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope a query to only include timeslots for client's linked providers.
     */
    public function scopeForClientProviders($query, User $client)
    {
        $providerIds = $client->providers()->pluck('users.id');

        return $query->whereIn('provider_id', $providerIds);
    }

    /**
     * Scope a query to filter by multiple provider IDs.
     */
    public function scopeForProviders($query, array $providerIds)
    {
        return $query->whereIn('provider_id', $providerIds);
    }

    /**
     * Get the end time of the timeslot.
     */
    public function getEndTimeAttribute()
    {
        return $this->start_time->copy()->addMinutes($this->duration_minutes);
    }

    /**
     * Check if the timeslot is available for booking.
     */
    public function getIsAvailableAttribute(): bool
    {
        return $this->status === 'available';
    }

    /**
     * Check if the timeslot is booked.
     */
    public function getIsBookedAttribute(): bool
    {
        return $this->status === 'booked';
    }

    /**
     * Check if the timeslot is cancelled.
     */
    public function getIsCancelledAttribute(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Check if the timeslot is completed.
     */
    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Book this timeslot for a client.
     */
    public function book(int $clientId): bool
    {
        return $this->update([
            'client_id' => $clientId,
            'status' => 'booked',
        ]);
    }

    /**
     * Cancel this timeslot.
     */
    public function cancel(): bool
    {
        return $this->update(['status' => 'cancelled']);
    }

    /**
     * Mark this timeslot as completed.
     */
    public function complete(): bool
    {
        return $this->update(['status' => 'completed']);
    }

    /**
     * Make this timeslot available (clear booking).
     */
    public function makeAvailable(): bool
    {
        return $this->update([
            'client_id' => null,
            'status' => 'available',
        ]);
    }
}
