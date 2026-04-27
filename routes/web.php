<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationRegistrationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Provider\ClientController;
use App\Http\Controllers\Provider\ClientNoteController;
use App\Http\Controllers\Provider\InvitationController;
use App\Http\Controllers\Provider\TimeslotController as ProviderTimeslotController;
use App\Http\Controllers\TimeslotController;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('calendar');
    }

    $appUrl = rtrim(config('app.url'), '/');

    return Inertia::render('welcome', [
        'canRegister' => true,
        'appUrl' => $appUrl,
        'seoImageUrl' => $appUrl.config('seo.default_image_path'),
    ]);
})->name('home');

Route::get('sitemap.xml', function () {
    $urls = [
        [
            'loc' => route('home'),
            'lastmod' => Carbon::now()->toDateString(),
            'changefreq' => 'weekly',
            'priority' => '1.0',
        ],
        [
            'loc' => route('contact.show'),
            'lastmod' => Carbon::now()->toDateString(),
            'changefreq' => 'monthly',
            'priority' => '0.7',
        ],
    ];

    $xmlUrls = collect($urls)
        ->map(function (array $url): string {
            return "<url><loc>{$url['loc']}</loc><lastmod>{$url['lastmod']}</lastmod><changefreq>{$url['changefreq']}</changefreq><priority>{$url['priority']}</priority></url>";
        })
        ->implode('');

    $xml = '<?xml version="1.0" encoding="UTF-8"?>'
        .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        .$xmlUrls
        .'</urlset>';

    return response($xml, 200)->header('Content-Type', 'application/xml');
})->name('sitemap');

Route::get('robots.txt', function () {
    $appUrl = rtrim(config('app.url'), '/');

    $content = implode("\n", [
        'User-agent: *',
        "Sitemap: {$appUrl}/sitemap.xml",
        'Disallow: /dashboard',
        'Disallow: /calendar',
        'Disallow: /timeslots',
        'Disallow: /provider/',
        'Disallow: /admin/',
        'Disallow: /settings/',
    ]);

    return response($content, 200)->header('Content-Type', 'text/plain; charset=UTF-8');
})->name('robots');

// Contact routes
Route::get('contact', [ContactController::class, 'show'])->name('contact.show');
Route::post('contact', [ContactController::class, 'store'])->name('contact.store')->middleware('throttle:5,1');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Calendar - All authenticated users
    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar');

    // Timeslots - All authenticated users can view
    Route::get('timeslots', [TimeslotController::class, 'index'])->name('timeslots.index');

    // Timeslot booking - Client and Admin only
    Route::middleware(['role:client,admin', 'throttle:20,1'])->group(function () {
        Route::post('timeslots', [TimeslotController::class, 'store'])->name('timeslots.store');
    });

    // Booking cancellation - Client, Provider, or Admin
    Route::delete('timeslots/{timeslot}', [TimeslotController::class, 'destroy'])->name('timeslots.destroy');

    // Comment update - Client, Provider, or Admin
    Route::patch('timeslots/{timeslot}/comment', [TimeslotController::class, 'updateComment'])->name('timeslots.updateComment');

    // Timeslot deletion - Service Provider or Admin only
    Route::delete('timeslots/{timeslot}/force-delete', [TimeslotController::class, 'forceDelete'])
        ->name('timeslots.forceDelete')
        ->middleware('role:service_provider,admin');

    // Mark timeslot as completed - Service Provider or Admin only
    Route::patch('timeslots/{timeslot}/complete', [TimeslotController::class, 'complete'])
        ->name('timeslots.complete')
        ->middleware('role:service_provider,admin');

    // Revert completed timeslot back to booked - Service Provider or Admin only
    Route::patch('timeslots/{timeslot}/revert', [TimeslotController::class, 'revert'])
        ->name('timeslots.revert')
        ->middleware('role:service_provider,admin');

    // Provider routes
    Route::prefix('provider')->name('provider.')->middleware(['role:service_provider,admin', 'throttle:60,1'])->group(function () {
        // Timeslots
        Route::post('timeslots', [ProviderTimeslotController::class, 'store'])->name('timeslots.store');
        Route::patch('timeslots/{timeslot}', [ProviderTimeslotController::class, 'update'])->name('timeslots.update');
        Route::delete('timeslots/{timeslot}', [ProviderTimeslotController::class, 'destroy'])->name('timeslots.destroy');
        Route::post('timeslots/{timeslot}/assign', [ProviderTimeslotController::class, 'assignClient'])->name('timeslots.assign');
        Route::delete('timeslots/{timeslot}/remove', [ProviderTimeslotController::class, 'removeClient'])->name('timeslots.remove');

        // Clients
        Route::get('clients', [ClientController::class, 'index'])->name('clients.index');
        Route::get('clients/create', [ClientController::class, 'create'])->name('clients.create');
        Route::post('clients', [ClientController::class, 'store'])->name('clients.store');
        Route::delete('clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');
        Route::get('clients/{client}/edit', [ClientController::class, 'edit'])->name('clients.edit');
        Route::put('clients/{client}', [ClientController::class, 'update'])->name('clients.update');
        Route::get('clients/{client}', [ClientController::class, 'show'])->name('clients.show');

        // Client notes
        Route::post('clients/{client}/notes', [ClientNoteController::class, 'store'])->name('clients.notes.store');
        Route::put('clients/{client}/notes/{note}', [ClientNoteController::class, 'update'])->name('clients.notes.update');
        Route::delete('clients/{client}/notes/{note}', [ClientNoteController::class, 'destroy'])->name('clients.notes.destroy');

        // Client invitations
        Route::post('invitations', [InvitationController::class, 'store'])->name('invitations.store');
        Route::delete('invitations/{invitation}', [InvitationController::class, 'destroy'])->name('invitations.destroy');
    });

    // Admin routes
    Route::prefix('admin')->name('admin.')->middleware(['role:admin', 'throttle:30,1'])->group(function () {
        Route::resource('users', AdminUserController::class);
        Route::patch('users/{user}/role', [AdminUserController::class, 'updateRole'])->name('users.updateRole');
        Route::post('users/{user}/attach-provider', [AdminUserController::class, 'attachProvider'])->name('users.attachProvider');
    });

    // Notification routes - Service Provider and Admin only
    Route::middleware('role:service_provider,admin')->group(function () {
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    });
});

// Public invitation registration routes (guest only)
Route::middleware(['guest', 'throttle:6,1'])->group(function () {
    Route::get('invitation/{token}', [InvitationRegistrationController::class, 'show'])->name('invitation.show');
    Route::post('invitation/{token}', [InvitationRegistrationController::class, 'register'])->name('invitation.register');
});

require __DIR__.'/settings.php';
