# Feature Specification: Timeslot Booking Management System

**Feature Branch**: `001-timeslot-booking`  
**Created**: 2025-11-22  
**Status**: Draft  
**Input**: User description: "Build an application that manages booking of time slots. There are three roles: 1. Admin - user management, can act on behalf of ServiceProvider 2. ServiceProvider - create available timeslots for own service, add customers to timeslots, cancel timeslots, cancel client's assignments 3. Client - can book/decline booking timeslots"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Client Books Available Timeslot (Priority: P1)

A client views available timeslots in the calendar and books a slot that fits their schedule. This is the core value proposition of the system.

**Why this priority**: This is the primary use case that delivers immediate value - allowing clients to reserve service appointments without phone calls or emails.

**Independent Test**: Can be fully tested by creating a service provider with available timeslots, logging in as a client, viewing the calendar with available slots, and successfully booking one. Delivers immediate value as a basic appointment booking system.

**Acceptance Scenarios**:

1. **Given** a client is logged in and viewing the calendar, **When** they select a day with available slots and click "Book", **Then** the system reserves that slot for them and shows a confirmation
2. **Given** a client has booked a timeslot, **When** they view their bookings list, **Then** they see the booked slot with service provider details, date, and time
3. **Given** a timeslot has been booked by one client, **When** another client views the calendar, **Then** that slot appears as booked
4. **Given** a client is viewing a fully booked service provider's schedule in the calendar, **When** they load the page, **Then** they see all slots marked as booked
5. **Given** a client has a confirmed booking within 3 days, **When** they visit the calendar page, **Then** they see a flash notification message with appointment details (provider name, date, time)
6. **Given** a client views the calendar, **When** the page loads, **Then** they only see timeslots starting from the current time onwards (no past timeslots are displayed)
7. **Given** a client has multiple upcoming bookings within 3 days, **When** they visit the calendar, **Then** they see separate notification messages for each upcoming appointment

---

### User Story 2 - Service Provider Creates Available Timeslots (Priority: P1)

A service provider defines their availability by creating timeslots for their service, specifying date, time, and duration. Clients can then book these slots.

**Why this priority**: Without service providers creating availability, clients have nothing to book. This is equally critical to P1 for a functional MVP.

**Independent Test**: Can be fully tested by logging in as a service provider, creating multiple timeslots with different dates and times, and verifying they appear in the provider's schedule. Delivers value as a schedule management tool.

**Acceptance Scenarios**:

1. **Given** a service provider is logged in, **When** they create a new timeslot with date, start time, and duration, **Then** the slot is saved and appears in their schedule
2. **Given** a service provider is viewing their schedule, **When** they see their created timeslots, **Then** each slot shows its date, time, duration, and booking status (available/booked)
3. **Given** a service provider creates overlapping timeslots, **When** they attempt to save, **Then** the system prevents the creation and shows a validation error
4. **Given** a service provider creates a timeslot in the past, **When** they attempt to save, **Then** the system prevents the creation and shows a validation error

---

### User Story 3 - Service Provider Manages Bookings (Priority: P2)

A service provider can manually add clients to timeslots, cancel timeslots, and remove client bookings when needed (e.g., rescheduling, client no-show).

**Why this priority**: Provides flexibility for service providers to handle edge cases and manual interventions, but the system is functional without it.

**Independent Test**: Can be fully tested by creating timeslots, booking some via client actions, then using provider controls to add clients, remove bookings, and cancel slots. Delivers value as an administrative override capability.

**Acceptance Scenarios**:

1. **Given** a service provider views an available timeslot, **When** they manually assign a client to that slot, **Then** the slot is marked as booked for that client and the client sees it in their bookings
2. **Given** a service provider views a booked timeslot, **When** they remove the client's booking, **Then** the slot becomes available again and the client no longer sees it in their bookings
3. **Given** a service provider views any timeslot (booked or available), **When** they cancel the entire timeslot, **Then** the slot is removed from the schedule and any booked clients are notified
4. **Given** a service provider cancels a booked timeslot, **When** the client views their bookings, **Then** they see a cancellation notice for that appointment

---

### User Story 4 - Client Declines/Cancels Booking (Priority: P2)

A client can cancel their booking if they can no longer make the appointment, freeing the slot for other clients.

**Why this priority**: Important for user experience and slot utilization, but the core booking functionality works without it.

**Independent Test**: Can be fully tested by booking a timeslot as a client, then canceling it, and verifying it becomes available again. Delivers value as a self-service cancellation feature.

**Acceptance Scenarios**:

1. **Given** a client has a booked timeslot, **When** they click "Cancel Booking", **Then** the booking is removed and the slot becomes available again
2. **Given** a client cancels their booking, **When** other clients view available timeslots, **Then** the canceled slot appears as available
3. **Given** a client views their bookings list, **When** they see a canceled booking, **Then** it is marked as "Canceled" with a timestamp
4. **Given** a client tries to cancel a timeslot that starts in less than 24 hours, **When** they attempt to cancel, **Then** the system shows a warning but still allows cancellation (no hard restriction for MVP)

---

### User Story 5 - Admin Manages Users (Priority: P3)

An admin can create, update, and delete user accounts, and assign roles (Admin, ServiceProvider, Client).

**Why this priority**: Essential for a production system but not needed for core booking functionality. Admin-created accounts only (no self-registration).

**Independent Test**: Can be fully tested by logging in as an admin, creating users with different roles, and verifying role-based access control works. Delivers value as a complete user management system.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they create a new user with role "ServiceProvider", **Then** that user can log in and access provider features
2. **Given** an admin views the users list, **When** they see all users, **Then** each user displays their name, email, role, and status (active/inactive)
3. **Given** an admin selects a user, **When** they change the user's role from "Client" to "ServiceProvider", **Then** the user gains provider permissions on their next login
4. **Given** an admin deletes a user, **When** that user tries to log in, **Then** they see an "account not found" error

---

### User Story 6 - Admin Acts on Behalf of Service Provider (Priority: P3)

An admin can perform any service provider action on behalf of any provider, enabling customer support and system administration.

**Why this priority**: Useful for support scenarios but not required for the core booking workflow.

**Independent Test**: Can be fully tested by logging in as an admin, selecting a service provider, and creating/managing timeslots for them. Delivers value as an admin support tool.

**Acceptance Scenarios**:

1. **Given** an admin is logged in, **When** they select "Act as Provider" for a specific service provider, **Then** they see that provider's dashboard and can perform all provider actions
2. **Given** an admin is acting on behalf of a provider, **When** they create a timeslot, **Then** the slot is associated with the selected provider, not the admin
3. **Given** an admin creates a timeslot for a provider, **When** the provider logs in, **Then** they see the timeslot in their schedule
4. **Given** an admin is acting as a provider, **When** they switch back to admin view, **Then** they return to the admin dashboard

---

### Edge Cases

- **What happens when a client tries to book a slot that was just booked by another client (race condition)?** System should detect the conflict and show an error message
- **How does the system handle timezone differences?** System operates in a single timezone (server timezone). All times are displayed and stored in this timezone without conversion. Multi-timezone support is out of scope for MVP.
- **What happens when a service provider tries to delete their account with future bookings?** System should prevent deletion or require booking cancellation first
- **How does the system handle recurring timeslots?** Recurring timeslots are out of scope for MVP. Only one-off timeslots are supported. Providers must create each timeslot individually.
- **What happens when a timeslot duration is modified after it's been booked?** System should prevent modification of booked slots
- **How are clients notified of booking confirmations and cancellations?** Email notifications are used for booking confirmations and cancellations. In-app flash messages provide immediate feedback. SMS notifications are out of scope.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Authorization:**
- **FR-001**: System MUST support three distinct user roles: Admin, ServiceProvider, and Client
- **FR-002**: System MUST authenticate users via email and password
- **FR-003**: System MUST restrict feature access based on user roles (role-based access control)
- **FR-004**: Admin users MUST be able to perform all actions available to ServiceProviders
- **FR-005**: Users MUST be able to log in and log out securely
- **FR-005a**: Users MUST be able to reset their password via email link without admin intervention

**Timeslot Management (ServiceProvider):**
- **FR-006**: ServiceProviders MUST be able to create timeslots specifying date, start time, and duration
- **FR-007**: ServiceProviders MUST be able to view all their created timeslots in a schedule view
- **FR-008**: ServiceProviders MUST be able to cancel any of their timeslots (booked or available)
- **FR-009**: ServiceProviders MUST be able to manually assign a client to an available timeslot
- **FR-010**: ServiceProviders MUST be able to remove a client's booking from any of their timeslots
- **FR-011**: System MUST prevent ServiceProviders from creating overlapping timeslots
- **FR-012**: System MUST prevent ServiceProviders from creating timeslots in the past

**Booking Management (Client):**
- **FR-013**: Clients MUST be able to view timeslots (available and booked) in a calendar view from their linked service providers only (see 002-client-provider-link for relationship management)
- **FR-014**: Clients MUST be able to book an available timeslot from the calendar view
- **FR-015**: Clients MUST be able to view their own booked timeslots
- **FR-016**: Clients MUST be able to cancel their own bookings
- **FR-017**: System MUST prevent clients from booking timeslots that are already booked
- **FR-018**: System MUST prevent clients from booking multiple overlapping timeslots

**User Management (Admin):**
- **FR-019**: Admins MUST be able to create new user accounts with assigned roles
- **FR-020**: Admins MUST be able to view a list of all users with their roles
- **FR-021**: Admins MUST be able to update user roles
- **FR-022**: Admins MUST be able to delete user accounts (with appropriate safeguards)
- **FR-023**: Admins MUST be able to act on behalf of any ServiceProvider (create, cancel, manage timeslots)

**Data Integrity:**
- **FR-024**: System MUST ensure timeslot bookings are atomic (no double-booking race conditions)
- **FR-025**: System MUST maintain referential integrity between users, timeslots, and bookings
- **FR-026**: System MUST prevent deletion of ServiceProvider accounts with future active bookings
- **FR-027**: System MUST log all booking creations, modifications, and cancellations with timestamps and user identity

**Booking Status & Calendar Features:**
- **FR-028**: System MUST automatically mark bookings as 'completed' after their timeslot end time has passed (via hourly scheduled task)
- **FR-029**: Clients MUST see only future-available timeslots (from current time onwards) in the calendar view to focus on bookable appointments
- **FR-030**: Clients MUST receive visual flash notifications for confirmed bookings occurring within the next 3 days when viewing the calendar page

### Key Entities

- **User**: Represents system users with name, email, password (hashed), and role (Admin/ServiceProvider/Client). Each user can have multiple bookings (as Client) or multiple timeslots (as ServiceProvider)

- **ServiceProvider Profile**: Extends User entity with service-specific information like service name, description, and contact information. Has one-to-many relationship with Timeslots

- **Timeslot**: Represents an appointment slot with date, start time, duration (minutes), status (available/booked/cancelled/completed), associated ServiceProvider, and optional Client reference. Status values: 'available' (no client assigned), 'booked' (client assigned, upcoming), 'cancelled' (manually cancelled), 'completed' (automatically set after end time passes). The Booking entity has been consolidated into Timeslot - client_id is stored directly on the timeslot record.

- **ProviderClient**: Pivot entity representing the many-to-many relationship between service providers and clients. Contains provider_id, client_id, created_at, created_by_provider flag, and status (active/inactive). Unique constraint on (provider_id, client_id) prevents duplicate relationships.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Clients can discover and book an available timeslot in under 60 seconds from login
- **SC-002**: Service providers can create a week's worth of availability (20+ timeslots) in under 5 minutes
- **SC-003**: System prevents double-booking conflicts 100% of the time through proper concurrency handling
- **SC-004**: Users can complete their primary task (book/create/manage timeslots) successfully on first attempt without training or documentation
- **SC-005**: System displays timeslots and bookings with accurate date/time information in user's context
- **SC-006**: 95% of user actions (book, cancel, create slot) complete within 2 seconds
- **SC-007**: Admin can resolve any user issue (cancel bookings, manage slots) without requiring service provider or client involvement

### Business Value

- **SC-008**: Eliminate manual scheduling overhead by enabling self-service booking
- **SC-009**: Reduce scheduling conflicts and no-shows through immediate booking confirmation
- **SC-010**: Enable service providers to manage availability independently without admin intervention
- **SC-011**: Provide complete audit trail of all bookings and changes for accountability

## Assumptions

1. **Single Service Per Provider**: Each service provider offers one type of service (not managing multiple service types with different durations/pricing)
2. **Same-Day Booking Allowed**: Clients can book timeslots on the same day unless explicitly cancelled
3. **No Payment Processing**: Booking system handles reservations only, not payments or deposits
4. **English Language Only**: Initial implementation supports English language UI
5. **Web-Based Interface**: Primary interface is web browser (desktop and mobile responsive), no native mobile apps
6. **Email Notifications**: User notifications are handled via email (no SMS or push notifications initially)
7. **Single Timezone**: All users operate in the same timezone for MVP (timezone support can be added later)
8. **Admin-Created Users**: Users are created by admin only (no self-registration). Users receive initial credentials and can reset their password via email link.

## Out of Scope

- Payment processing or pricing per timeslot
- Calendar integrations (Google Calendar, Outlook)
- Recurring timeslot templates
- Waitlist functionality when slots are full
- Review/rating system for service providers
- Multi-language support
- SMS notifications
- Video conferencing integration
- Resource management (rooms, equipment)
- Group bookings or appointments
- Self-service user registration (admin creates all accounts)

## Calendar View (Primary Interface)

- **Unified Route**: The application provides a single `/calendar` route accessible to all authenticated users regardless of role (Admin, ServiceProvider, or Client).
- **Role-Agnostic Interface**: The same calendar page and component are displayed to all roles. User interactions (booking, managing timeslots) are controlled by role-based permissions, not by separate views.
- **Calendar Display**: The calendar shows a monthly calendar grid displaying all timeslots for the selected month across all service providers.
- **Client Time Filtering**: Clients see only future timeslots starting from the current time onwards. Past timeslots are not displayed to clients to focus on bookable slots. Providers and admins see timeslots from yesterday onwards for management purposes.
- **Upcoming Booking Alerts**: When a client has confirmed bookings within the next 3 days, flash message notifications appear at the top of the calendar showing the appointment details (provider, date, time).
- **Navigation**: Users can navigate between months using previous/next controls.
- **Day View**: Each day shows the number of timeslots and visual indicators for their status.
- **Timeslot Details**: Clicking on a day with timeslots opens a dialog showing detailed information for all slots on that date.
- **Status Indicators**: Each timeslot is visually marked with its status: **Available** (green), **Booked** (blue), or **Cancelled** (not displayed by default).
- **Contextual Actions**: Users can interact with timeslots directly from the calendar dialog according to their role and permissions (e.g., clients can book available slots, providers can manage their slots).
- **Persistent View State**: The calendar remembers the user's current view (selected month/year) indefinitely. When a user navigates away and returns to `/calendar`, they see the same month they were previously viewing, not today's date. This view state persists across sessions (stored in user preferences or browser storage).
- **Interface Replacement**: The calendar replaces the previous list-based browsing interface, providing a more intuitive date-based navigation.

## Booking Status Lifecycle

The system manages three booking statuses that represent the lifecycle of an appointment:

- **confirmed**: Active booking, appointment scheduled and upcoming. This is the default status when a booking is created.
- **cancelled**: Booking was cancelled by either the client or provider before the appointment occurred. Cancellation is a terminal state.
- **completed**: Appointment has passed (automatically set after timeslot end_time). This status is applied by an automated hourly process.

**Automated Status Management:**
The system runs an hourly scheduled task (`bookings:update-completed`) that automatically updates all confirmed bookings to completed status once their associated timeslot's end time has passed. This ensures accurate historical record-keeping and allows users to distinguish between upcoming and past appointments.