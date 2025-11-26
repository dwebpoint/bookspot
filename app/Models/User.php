<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'timezone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the timeslots created by this provider.
     */
    public function timeslots()
    {
        return $this->hasMany(Timeslot::class, 'provider_id');
    }

    /**
     * Get the timeslots booked by this client.
     */
    public function bookedTimeslots()
    {
        return $this->hasMany(Timeslot::class, 'client_id');
    }

    /**
     * Check if user is an admin.
     */
    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    /**
     * Check if user is a service provider.
     */
    public function isServiceProvider(): bool
    {
        return $this->hasRole('service_provider');
    }

    /**
     * Check if user is a client.
     */
    public function isClient(): bool
    {
        return $this->hasRole('client');
    }

    /**
     * Get the clients linked to this provider.
     * (For service_provider role)
     */
    public function clients()
    {
        return $this->belongsToMany(User::class, 'provider_client', 'provider_id', 'client_id')
            ->withPivot('created_by_provider', 'status')
            ->withTimestamps()
            ->wherePivot('status', 'active');
    }

    /**
     * Get the providers linked to this client.
     * (For client role)
     */
    public function providers()
    {
        return $this->belongsToMany(User::class, 'provider_client', 'client_id', 'provider_id')
            ->withPivot('created_by_provider', 'status')
            ->withTimestamps()
            ->wherePivot('status', 'active');
    }

    /**
     * Check if this provider has a specific client.
     */
    public function hasClient(int $clientId): bool
    {
        return $this->clients()->where('client_id', $clientId)->exists();
    }

    /**
     * Check if this client is linked to a specific provider.
     */
    public function hasProvider(int $providerId): bool
    {
        return $this->providers()->where('provider_id', $providerId)->exists();
    }
}
