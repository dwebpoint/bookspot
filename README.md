# BookSpot

> Simple scheduling for service professionals.

![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

A scheduling platform that connects service providers with clients. BookSpot streamlines appointment management for service-based businesses — providers set their availability through an intuitive weekly calendar, and clients book directly from available timeslots.

### Who it's for

- **Service providers** — consultants, coaches, therapists, freelancers, or any professional offering scheduled services
- **Clients** — individuals booking appointments with their service providers

### Core value

- **For providers**: Eliminate back-and-forth scheduling. Set availability once, let clients self-book.
- **For clients**: See real-time availability and book instantly.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 13, PHP 8.4, [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission) |
| Frontend | React 19, TypeScript 5.9, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com), [Radix UI](https://www.radix-ui.com) |
| Bridge | [Inertia.js v3](https://inertiajs.com) with SSR enabled |
| Build | Vite 8, [Laravel Wayfinder](https://github.com/laravel/wayfinder) for type-safe routing |
| Auth | Laravel Fortify |
| Database | MariaDB 10.11 (production), SQLite (tests) |
| Local dev | [DDEV](https://ddev.readthedocs.io/) |

## Features

### 📅 Timeslot management
- Weekly calendar view — the primary interface for all timeslot operations
- Service providers create, edit, and delete timeslots via modals (no separate pages)
- Three statuses: `available`, `booked`, `completed`
- Providers can assign a specific client when creating or editing a timeslot
- Providers can add and update a comment on any timeslot
- Completed timeslots can be reverted to `booked`

### 👥 Client-provider relationships
- Providers invite clients by email; existing users are linked automatically, new users receive a registration link
- Many-to-many relationships — clients can have multiple providers and vice versa
- Provider-specific client list with CRUD, notes, and activity history
- Per-client notes with full create / edit / delete support
- Shared client indicators and provider filtering on the calendar

### 🔐 Role-based access control
- Three roles via [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission): **Admin**, **Service Provider**, **Client**
- Policy-based authorization on every resource
- Admin panel for user management and role assignment

### 🔔 Notifications
- **Email notifications** — opt-in per user (Settings → Notifications, off by default)
  - Providers are notified when a client books or cancels; provider-initiated changes do not trigger emails
  - Event-driven: `TimeslotBooked` / `TimeslotCancelled` → `SendTimeslotNotifications` → synchronous Mailables (sent inline, no queue worker required)
- **In-app notifications** — stored in the database and surfaced in the UI

### 🎨 UI/UX
- Responsive design with Tailwind CSS 4
- Dark mode support
- shadcn/ui + Radix UI component library
- SEO-optimised public pages (meta description, Open Graph, Twitter Card, canonical URL, SSR)

### ✉️ Contact page
- Public `/contact` form for general enquiries, delivered by email

---

## Quick start

### Prerequisites

| Tool | Version |
|------|---------|
| PHP | 8.4+ |
| Composer | 2.x |
| Node.js | 20+ |
| DDEV | latest (recommended) |

### With DDEV (recommended)

```bash
git clone https://github.com/your-org/bookspot.git && cd bookspot
ddev start
ddev composer setup   # installs deps, copies .env, migrates, seeds, builds assets
ddev composer dev     # starts queue worker + Vite HMR
```

App is available at **https://bookspot.ddev.site**.

### Without DDEV

```bash
git clone https://github.com/your-org/bookspot.git && cd bookspot

composer install && npm install

cp .env.example .env
php artisan key:generate
# Edit .env — set DB_* to your local MariaDB/MySQL instance

php artisan migrate

# Seed roles, permissions, and demo data
php artisan db:seed

npm run build

php artisan serve
npm run dev
```

### Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password |
| Service provider | provider1@bookspot.test | password |
| Service provider | provider2@bookspot.test | password |
| Service provider | provider3@bookspot.test | password |
| Client | client1@bookspot.test | password |
| Client | client2@bookspot.test | password |
| Client | client3@bookspot.test | password |

---

## RBAC system

### Roles

| Role | Access |
|------|--------|
| **Admin** | Full system access, user management, role assignment |
| **Service Provider** | Manage own timeslots and clients |
| **Client** | Browse availability, book and cancel timeslots |

### Key permissions

- Timeslot: `view timeslots`, `create timeslots`, `update timeslots`, `delete timeslots`, `assign timeslots`
- Client: `view clients`, `create clients`, `update clients`, `delete clients`
- User: `view users`, `create users`, `update users`, `delete users` (admin only)

See [docs/SPATIE_PERMISSIONS.md](docs/SPATIE_PERMISSIONS.md) for the full permission matrix.

---

## Project structure

```
app/
├── Actions/Fortify/            # Fortify auth actions (register, update profile, etc.)
├── Enums/
│   ├── TimeslotStatus.php      # Available | Booked | Completed
│   └── ProviderClientStatus.php
├── Events/
│   ├── TimeslotBooked.php
│   └── TimeslotCancelled.php
├── Http/
│   ├── Controllers/
│   │   ├── Admin/              # User management
│   │   ├── Provider/           # Timeslots, clients, client notes, invitations
│   │   ├── Settings/           # Profile, password, appearance, notifications, info (admin-only)
│   │   ├── CalendarController.php
│   │   ├── ContactController.php
│   │   ├── DashboardController.php
│   │   ├── InvitationRegistrationController.php
│   │   ├── NotificationController.php
│   │   └── TimeslotController.php
│   └── Requests/               # Form request validation
├── Listeners/
│   └── SendTimeslotNotifications.php
├── Mail/
│   ├── ClientInvitation.php
│   ├── ContactForm.php
│   ├── TimeslotBooked.php
│   └── TimeslotCancelled.php
├── Models/
│   ├── ClientNote.php
│   ├── Invitation.php
│   ├── ProviderClient.php
│   ├── SiteSettings.php
│   ├── Timeslot.php
│   └── User.php
├── Notifications/
│   ├── TimeslotBookedNotification.php
│   └── TimeslotCancelledNotification.php
└── Policies/                   # TimeslotPolicy, UserPolicy, ClientNotePolicy, InvitationPolicy, ProviderClientPolicy

resources/js/
├── components/                 # Reusable shadcn/ui components
├── layouts/                    # Authenticated and guest layouts
├── pages/
│   ├── Admin/Users/            # User management pages
│   ├── auth/                   # Login, register, password reset, etc.
│   ├── Calendar/               # Main calendar view
│   ├── Invitation/             # Invitation registration flow
│   ├── Provider/Clients/       # Client management pages
│   ├── settings/               # Profile, password, appearance, notifications, info (admin-only)
│   ├── Timeslots/              # Timeslot list for clients
│   ├── contact.tsx
│   ├── dashboard.tsx
│   ├── Error.tsx
│   └── welcome.tsx
├── types/                      # TypeScript type definitions
└── hooks/                      # Custom React hooks

database/
├── factories/
├── migrations/
└── seeders/
    ├── DatabaseSeeder.php
    ├── RolesAndPermissionsSeeder.php
    ├── RoleSeeder.php
    ├── TimeslotBookingSeeder.php
    └── ClientSeeder.php
```

---

## Development

### Running tests

Tests use an in-memory SQLite database — no external database required.

```bash
php artisan test                         # full suite
php artisan test --compact               # compact output
php artisan test --filter=TestName       # single test or class
```

### Code quality

```bash
# PHP static analysis (PHPStan / Larastan, level 6)
vendor/bin/phpstan analyse --no-progress

# PHP formatting
vendor/bin/pint

# TypeScript type check
npm run types

# ESLint
npm run lint

# Prettier
npm run format
```

---

## Documentation

- [Spatie permissions setup](docs/SPATIE_PERMISSIONS.md)
- [Calendar client display](docs/CALENDAR_CLIENT_DISPLAY.md)
- [Contributing guide](CONTRIBUTING.md)

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## License

BookSpot is open-sourced software licensed under the [MIT license](LICENSE).
