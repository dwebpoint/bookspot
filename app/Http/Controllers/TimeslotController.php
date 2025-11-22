<?php

namespace App\Http\Controllers;

use App\Models\Timeslot;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimeslotController extends Controller
{
    /**
     * Display a listing of available timeslots.
     */
    public function index(Request $request): Response
    {
        $query = Timeslot::with('provider')
            ->available()
            ->orderBy('start_time');

        // Filter by provider if specified
        if ($request->provider_id) {
            $query->where('provider_id', $request->provider_id);
        }

        // Filter by date if specified
        if ($request->date) {
            $query->whereDate('start_time', $request->date);
        }

        return Inertia::render('Timeslots/Index', [
            'timeslots' => $query->paginate(20),
            'filters' => $request->only(['provider_id', 'date']),
            'providers' => User::where('role', 'service_provider')
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }
}
