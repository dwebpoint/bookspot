<?php

namespace App\Providers;

use App\Models\Booking;
use App\Models\Timeslot;
use App\Models\User;
use App\Policies\BookingPolicy;
use App\Policies\ProviderClientPolicy;
use App\Policies\TimeslotPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Timeslot::class, TimeslotPolicy::class);
        Gate::policy(Booking::class, BookingPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        
        // Register policy for provider-client relationships
        Gate::define('viewAnyClients', [ProviderClientPolicy::class, 'viewAny']);
        Gate::define('viewClient', [ProviderClientPolicy::class, 'view']);
        Gate::define('createClient', [ProviderClientPolicy::class, 'create']);
        Gate::define('deleteClient', [ProviderClientPolicy::class, 'delete']);
        Gate::define('assignTimeslotToClient', [ProviderClientPolicy::class, 'assignTimeslot']);
    }
}
