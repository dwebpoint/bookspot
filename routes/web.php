<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\Provider\TimeslotController as ProviderTimeslotController;
use App\Http\Controllers\TimeslotController;
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

    // Timeslots - All authenticated users can view
    Route::get('timeslots', [TimeslotController::class, 'index'])->name('timeslots.index');

    // Timeslot booking - Client and Admin only
    Route::middleware('role:client,admin')->group(function () {
        Route::post('timeslots', [TimeslotController::class, 'store'])->name('timeslots.store');
    });

    // Booking cancellation - Client, Provider, or Admin
    Route::delete('timeslots/{timeslot}', [TimeslotController::class, 'destroy'])->name('timeslots.destroy');

    // Timeslot deletion - Service Provider or Admin only
    Route::delete('timeslots/{timeslot}/force-delete', [TimeslotController::class, 'forceDelete'])
        ->name('timeslots.forceDelete')
        ->middleware('role:service_provider,admin');

    // Mark timeslot as completed - Service Provider or Admin only
    Route::patch('timeslots/{timeslot}/complete', [TimeslotController::class, 'complete'])
        ->name('timeslots.complete')
        ->middleware('role:service_provider,admin');

    // Provider routes
    Route::prefix('provider')->name('provider.')->middleware('role:service_provider,admin')->group(function () {
        // Timeslots
        Route::post('timeslots', [ProviderTimeslotController::class, 'store'])->name('timeslots.store');
        Route::patch('timeslots/{timeslot}', [ProviderTimeslotController::class, 'update'])->name('timeslots.update');
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
