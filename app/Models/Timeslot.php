<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Timeslot extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'provider_id',
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
    ];

    /**
     * Get the provider (user) who created this timeslot.
     */
    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    /**
     * Get the booking for this timeslot.
     */
    public function booking(): HasOne
    {
        return $this->hasOne(Booking::class);
    }

    /**
     * Scope a query to only include available timeslots.
     */
    public function scopeAvailable($query)
    {
        return $query->whereDoesntHave('booking', function ($q) {
            $q->where('status', 'confirmed');
        })->where('start_time', '>', now());
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
        return !$this->booking || $this->booking->status === 'cancelled';
    }

    /**
     * Check if the timeslot is booked.
     */
    public function getIsBookedAttribute(): bool
    {
        return $this->booking && $this->booking->status === 'confirmed';
    }
}
