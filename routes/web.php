<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\Provider\TimeslotController as ProviderTimeslotController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('calendar');
    }

    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Calendar - All authenticated users
    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar');

    // Bookings - Client routes
    Route::middleware('role:client,admin')->group(function () {
        Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');
        Route::post('bookings', [BookingController::class, 'store'])->name('bookings.store');
    });

    // Booking cancellation - Client, Provider, or Admin
    Route::delete('bookings/{timeslot}', [BookingController::class, 'destroy'])->name('bookings.destroy');

    // Provider routes
    Route::prefix('provider')->name('provider.')->middleware('role:service_provider,admin')->group(function () {
        // Timeslots
        Route::get('timeslots', [ProviderTimeslotController::class, 'index'])->name('timeslots.index');
        Route::get('timeslots/create', [ProviderTimeslotController::class, 'create'])->name('timeslots.create');
        Route::post('timeslots', [ProviderTimeslotController::class, 'store'])->name('timeslots.store');
        Route::delete('timeslots/{timeslot}', [ProviderTimeslotController::class, 'destroy'])->name('timeslots.destroy');
        Route::post('timeslots/{timeslot}/assign', [ProviderTimeslotController::class, 'assignClient'])->name('timeslots.assign');
        Route::delete('timeslots/{timeslot}/remove', [ProviderTimeslotController::class, 'removeClient'])->name('timeslots.remove');
        
        // Clients
        Route::get('clients', [\App\Http\Controllers\Provider\ClientController::class, 'index'])->name('clients.index');
        Route::get('clients/create', [\App\Http\Controllers\Provider\ClientController::class, 'create'])->name('clients.create');
        Route::post('clients', [\App\Http\Controllers\Provider\ClientController::class, 'store'])->name('clients.store');
        Route::delete('clients/{client}', [\App\Http\Controllers\Provider\ClientController::class, 'destroy'])->name('clients.destroy');
        Route::get('clients/{client}/edit', [\App\Http\Controllers\Provider\ClientController::class, 'edit'])->name('clients.edit');
        Route::put('clients/{client}', [\App\Http\Controllers\Provider\ClientController::class, 'update'])->name('clients.update');
    });

    // Admin routes
    Route::prefix('admin')->name('admin.')->middleware('role:admin')->group(function () {
        Route::resource('users', AdminUserController::class);
    });
});

require __DIR__.'/settings.php';
