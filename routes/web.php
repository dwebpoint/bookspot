<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\Provider\TimeslotController as ProviderTimeslotController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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

    // Bookings - Client and Provider routes
    Route::get('bookings', [BookingController::class, 'index'])->name('bookings.index');

    // Booking creation - Client and Admin only
    Route::middleware('role:client,admin')->group(function () {
        Route::post('bookings', [BookingController::class, 'store'])->name('bookings.store');
    });

    // Booking cancellation - Client, Provider, or Admin
    Route::delete('bookings/{timeslot}', [BookingController::class, 'destroy'])->name('bookings.destroy');

    // Timeslot deletion from bookings page - Service Provider or Admin only
    Route::delete('bookings/{timeslot}/force-delete', [BookingController::class, 'forceDelete'])
        ->name('bookings.forceDelete')
        ->middleware('role:service_provider,admin');

    // Mark timeslot as completed - Service Provider or Admin only
    Route::patch('bookings/{timeslot}/complete', [BookingController::class, 'complete'])
        ->name('bookings.complete')
        ->middleware('role:service_provider,admin');

    // Provider routes
    Route::prefix('provider')->name('provider.')->middleware('role:service_provider,admin')->group(function () {
        // Timeslots
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
