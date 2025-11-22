# API Contracts: Timeslot & Calendar Routes

**Purpose**: Define all Inertia routes for timeslot management and calendar viewing with props and responses

---

## Route: GET /calendar (View Calendar)

**Name**: `calendar`  
**Access**: Client, ServiceProvider, Admin  
**Purpose**: View all timeslots in a monthly calendar view across all providers

### Request
```http
GET /calendar?month=2025-11
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| month | string | No | Month to display (YYYY-MM format). Defaults to current month |

### Response (Inertia Props)

**TypeScript Interface**:
```typescript
interface CalendarProps extends PageProps {
    timeslots: Timeslot[];
    month: string; // YYYY-MM format
}

interface Timeslot {
    id: number;
    provider_id: number;
    start_time: string; // ISO 8601 datetime
    duration_minutes: number;
    status: 'available' | 'booked' | 'cancelled';
    end_time: string; // Computed
    is_available: boolean;
    is_booked: boolean;
    provider: Provider;
    booking?: Booking;
}

interface Provider {
    id: number;
    name: string;
}

interface Booking {
    id: number;
    client_id: number;
    client: {
        id: number;
        name: string;
    };
}
```

**Laravel Controller**:
```php
public function index(Request $request): Response
{
    $month = $request->input('month', now()->format('Y-m'));
    $startDate = \Carbon\Carbon::createFromFormat('Y-m', $month)->startOfMonth();
    $endDate = $startDate->copy()->endOfMonth();
    
    // Get all timeslots for the month
    $timeslots = Timeslot::with(['provider:id,name', 'booking.client:id,name'])
        ->whereBetween('start_time', [$startDate, $endDate])
        ->orderBy('start_time')
        ->get();
    
    return Inertia::render('Calendar/Index', [
        'timeslots' => $timeslots,
        'month' => $month,
    ]);
}
```

---

## Route: POST /bookings (Create Booking)

**Name**: `bookings.store`  
**Access**: Client, Admin  
**Purpose**: Book an available timeslot

### Request
```http
POST /bookings
Content-Type: application/json

{
    "timeslot_id": 123
}
```

**Body Parameters**:
| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| timeslot_id | integer | Yes | exists:timeslots,id |

### Response

**Success (302 Redirect)**:
```
Redirect to: /bookings
Flash: { success: "Timeslot booked successfully!" }
```

**Error (422 Validation)**:
```json
{
    "errors": {
        "timeslot_id": [
            "This timeslot is already booked."
        ]
    }
}
```

**TypeScript (Form Handling)**:
```typescript
import { useForm } from '@inertiajs/react';

const { data, setData, post, processing, errors } = useForm({
    timeslot_id: null,
});

const handleBook = (timeslotId: number) => {
    setData('timeslot_id', timeslotId);
    post(route('bookings.store'), {
        onSuccess: () => {
            // Redirected to bookings.index
        },
    });
};
```

**Laravel Controller**:
```php
public function store(BookTimeslotRequest $request): RedirectResponse
{
    DB::transaction(function () use ($request) {
        $timeslot = Timeslot::where('id', $request->timeslot_id)
            ->whereDoesntHave('booking', fn($q) => $q->where('status', 'confirmed'))
            ->where('start_time', '>', now())
            ->lockForUpdate()
            ->firstOrFail();

        Booking::create([
            'timeslot_id' => $request->timeslot_id,
            'client_id' => auth()->id(),
            'status' => 'confirmed',
        ]);
    });

    return redirect()->route('bookings.index')
        ->with('success', 'Timeslot booked successfully!');
}
```

---

## Route: GET /provider/timeslots (Provider's Schedule)

**Name**: `provider.timeslots.index`  
**Access**: ServiceProvider, Admin  
**Purpose**: View own timeslots with booking status

### Request
```http
GET /provider/timeslots?status=all&date=
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter: all, available, booked |
| date | string | No | Filter by date (YYYY-MM-DD) |

### Response (Inertia Props)

**TypeScript Interface**:
```typescript
interface ProviderTimeslotsIndexProps extends PageProps {
    timeslots: Timeslot[];
    filters: {
        status?: 'all' | 'available' | 'booked';
        date?: string;
    };
}

interface Timeslot {
    id: number;
    start_time: string;
    duration_minutes: number;
    end_time: string;
    is_available: boolean;
    is_booked: boolean;
    booking?: Booking;
}

interface Booking {
    id: number;
    status: 'confirmed' | 'cancelled';
    client: {
        id: number;
        name: string;
        email: string;
    };
    created_at: string;
}
```

**Laravel Controller**:
```php
public function index(Request $request): Response
{
    $query = Timeslot::with('booking.client')
        ->forProvider(auth()->id())
        ->future()
        ->orderBy('start_time');

    if ($request->status === 'available') {
        $query->available();
    } elseif ($request->status === 'booked') {
        $query->whereHas('booking', fn($q) => $q->where('status', 'confirmed'));
    }

    if ($request->date) {
        $query->whereDate('start_time', $request->date);
    }

    return Inertia::render('Provider/Timeslots/Index', [
        'timeslots' => $query->get(),
        'filters' => $request->only(['status', 'date']),
    ]);
}
```

---

## Route: POST /provider/timeslots (Create Timeslot)

**Name**: `provider.timeslots.store`  
**Access**: ServiceProvider, Admin  
**Purpose**: Create a new available timeslot

### Request
```http
POST /provider/timeslots
Content-Type: application/json

{
    "start_time": "2025-11-25T14:00:00Z",
    "duration_minutes": 60
}
```

**Body Parameters**:
| Parameter | Type | Required | Validation |
|-----------|------|----------|------------|
| start_time | string | Yes | date, after:now, no overlap |
| duration_minutes | integer | Yes | min:15, max:480 |

### Response

**Success (302 Redirect)**:
```
Redirect to: /provider/timeslots
Flash: { success: "Timeslot created successfully!" }
```

**Error (422 Validation)**:
```json
{
    "errors": {
        "start_time": [
            "This timeslot overlaps with an existing timeslot."
        ]
    }
}
```

**TypeScript (Form Handling)**:
```typescript
const { data, setData, post, processing, errors } = useForm({
    start_time: '',
    duration_minutes: 60,
});

const submit = (e: FormEvent) => {
    e.preventDefault();
    post(route('provider.timeslots.store'));
};
```

**Laravel Controller**:
```php
public function store(StoreTimeslotRequest $request): RedirectResponse
{
    Timeslot::create([
        'provider_id' => auth()->id(),
        'start_time' => $request->start_time,
        'duration_minutes' => $request->duration_minutes,
    ]);

    return redirect()->route('provider.timeslots.index')
        ->with('success', 'Timeslot created successfully!');
}
```

---

## Route: DELETE /provider/timeslots/{timeslot} (Cancel Timeslot)

**Name**: `provider.timeslots.destroy`  
**Access**: ServiceProvider (own timeslots), Admin  
**Purpose**: Cancel a timeslot (cascades to bookings)

### Request
```http
DELETE /provider/timeslots/123
```

### Authorization
```php
// TimeslotPolicy
public function delete(User $user, Timeslot $timeslot): bool
{
    return $user->id === $timeslot->provider_id || $user->isAdmin();
}
```

### Response

**Success (302 Redirect)**:
```
Redirect to: /provider/timeslots
Flash: { success: "Timeslot cancelled successfully." }
```

**Laravel Controller**:
```php
public function destroy(Timeslot $timeslot): RedirectResponse
{
    $this->authorize('delete', $timeslot);

    $timeslot->delete(); // Cascades to bookings

    return redirect()->route('provider.timeslots.index')
        ->with('success', 'Timeslot cancelled successfully.');
}
```

---

## Route: GET /bookings (My Bookings)

**Name**: `bookings.index`  
**Access**: Client, Admin  
**Purpose**: View own bookings

### Request
```http
GET /bookings?status=all
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter: all, confirmed, cancelled |

### Response (Inertia Props)

**TypeScript Interface**:
```typescript
interface BookingsIndexProps extends PageProps {
    bookings: Booking[];
    filters: {
        status?: 'all' | 'confirmed' | 'cancelled';
    };
}

interface Booking {
    id: number;
    status: 'confirmed' | 'cancelled';
    created_at: string;
    timeslot: {
        id: number;
        start_time: string;
        duration_minutes: number;
        end_time: string;
        provider: {
            id: number;
            name: string;
            email: string;
        };
    };
}
```

**Laravel Controller**:
```php
public function index(Request $request): Response
{
    $query = Booking::with('timeslot.provider')
        ->forClient(auth()->id())
        ->orderBy('created_at', 'desc');

    if ($request->status === 'confirmed') {
        $query->confirmed();
    } elseif ($request->status === 'cancelled') {
        $query->cancelled();
    }

    return Inertia::render('Bookings/Index', [
        'bookings' => $query->get(),
        'filters' => $request->only('status'),
    ]);
}
```

---

## Route: DELETE /bookings/{booking} (Cancel Booking)

**Name**: `bookings.destroy`  
**Access**: Client (own bookings), ServiceProvider (for their timeslots), Admin  
**Purpose**: Cancel a booking

### Request
```http
DELETE /bookings/123
```

### Authorization
```php
// BookingPolicy
public function delete(User $user, Booking $booking): bool
{
    return $user->id === $booking->client_id 
        || $user->id === $booking->timeslot->provider_id
        || $user->isAdmin();
}
```

### Response

**Success (302 Redirect)**:
```
Redirect to: /bookings
Flash: { success: "Booking cancelled successfully." }
```

**Laravel Controller**:
```php
public function destroy(Booking $booking): RedirectResponse
{
    $this->authorize('delete', $booking);

    $booking->cancel();

    return redirect()->route('bookings.index')
        ->with('success', 'Booking cancelled successfully.');
}
```

---

## Summary of Routes

| Method | URI | Name | Access | Purpose |
|--------|-----|------|--------|---------|
| GET | /calendar | calendar | Client, SP, Admin | View calendar with all timeslots |
| POST | /bookings | bookings.store | Client, Admin | Book a timeslot |
| GET | /bookings | bookings.index | Client, Admin | View my bookings |
| DELETE | /bookings/{id} | bookings.destroy | Client, SP, Admin | Cancel booking |
| GET | /provider/timeslots | provider.timeslots.index | SP, Admin | View my schedule |
| GET | /provider/timeslots/create | provider.timeslots.create | SP, Admin | Create timeslot form |
| POST | /provider/timeslots | provider.timeslots.store | SP, Admin | Store new timeslot |
| DELETE | /provider/timeslots/{id} | provider.timeslots.destroy | SP, Admin | Cancel timeslot |
| POST | /provider/timeslots/{id}/assign | provider.timeslots.assign | SP, Admin | Manually assign client |
| DELETE | /provider/timeslots/{id}/remove | provider.timeslots.remove | SP, Admin | Remove client booking |

**Legend**: SP = ServiceProvider

---

## Shared Props (All Routes)

Defined in `HandleInertiaRequests::share()`:

```typescript
interface PageProps {
    auth: {
        user: User | null;
    };
    flash: {
        success?: string;
        error?: string;
    };
}

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'service_provider' | 'client';
    timezone: string;
}
```
