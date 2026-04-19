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

Built with Laravel 13, React 19, TypeScript, Tailwind CSS, and [Inertia](https://inertiajs.com). Uses [shadcn/ui](https://ui.shadcn.com) and [Radix UI](https://www.radix-ui.com) component libraries.

## Features

### 📅 Timeslot Management System
- Weekly calendar view with available timeslots
- Service providers can create and manage timeslots via modal interface
- Clients can book available timeslots
- Consolidated status tracking directly on timeslots (available, booked, completed, cancelled)

### 👥 Client-Provider Relationship Management
- Service providers can create and manage clients
- Many-to-many relationships (clients can have multiple providers)
- Automatic relationship linking when creating clients
- Shared client indicators and provider filtering
- Client count badges in navigation

### 🔐 Advanced RBAC with Spatie Permissions
- Role-based access control using [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)
- Three roles: Admin, Service Provider, Client
- 19 granular permissions for fine-grained access control
- Policy-based authorization for resources
- Backward compatible with existing role checks

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- shadcn/ui component library
- Dark mode support
- Calendar-first interface for timeslot browsing
- Search and filter capabilities

### 📧 Email Notifications
- Providers and clients can opt in to email notifications via Settings → Notifications
- Providers receive an email when a **client** books or cancels a timeslot (provider-initiated assign/remove does not trigger notifications)
- Event-driven architecture: `TimeslotBooked` / `TimeslotCancelled` events → `SendTimeslotNotifications` subscriber → queued Mailables
- Setting is disabled by default; each user controls their own preference

## Quick Start

### Prerequisites

- PHP 8.4+, Composer 2
- Node.js 20+
- [DDEV](https://ddev.readthedocs.io/) (recommended) **or** a local MySQL/MariaDB instance

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

# Install dependencies
composer install
npm install

# Configure environment
cp .env.example .env
php artisan key:generate
# Edit .env: set DB_* variables to your local database

# Set up database
php artisan migrate

# Seed roles and permissions (Spatie)
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=AssignRolesToExistingUsersSeeder

# Optional: Seed demo data
php artisan db:seed --class=ClientSeeder

# Build assets
npm run build

# Start development server
php artisan serve
npm run dev
```

### Default Users (after seeding)

- **Provider 1**: provider1@example.com / password
- **Provider 2**: provider2@example.com / password
- **Client 1**: client1@example.com / password
- **Client 2**: client2@example.com / password
- **Client 3**: client3@example.com / password (shared between providers)

## RBAC System

The application uses Spatie Laravel Permission for role and permission management.

### Roles

1. **Admin** - Full system access
2. **Service Provider** - Manage timeslots and clients
3. **Client** - Book timeslots and view bookings

### Key Permissions

- Timeslot management: `view`, `create`, `update`, `delete`, `assign timeslots`
- Client management: `view`, `create`, `update`, `delete clients`
- User management: `view`, `create`, `update`, `delete users` (admin only)

### Migration Guide

See [docs/SPATIE_PERMISSIONS.md](docs/SPATIE_PERMISSIONS.md) for detailed RBAC documentation.

## Project Structure

```
app/
├── Events/
│   ├── TimeslotBooked.php
│   └── TimeslotCancelled.php
├── Http/
│   ├── Controllers/
│   │   ├── Admin/          # Admin controllers
│   │   ├── Provider/       # Service provider controllers
│   │   ├── Settings/       # Profile, password, appearance, notifications
│   │   ├── CalendarController.php
│   │   └── TimeslotController.php
│   ├── Middleware/
│   │   └── CheckRole.php   # Role verification middleware
│   └── Requests/           # Form request validation
├── Listeners/
│   └── SendTimeslotNotifications.php
├── Mail/
│   ├── TimeslotBooked.php
│   └── TimeslotCancelled.php
├── Models/
│   ├── User.php           # User model with HasRoles trait
│   ├── Timeslot.php       # Timeslot with integrated booking status
│   └── ProviderClient.php
└── Policies/              # Authorization policies

resources/
└── js/
    ├── components/        # Reusable React components
    ├── layouts/          # Page layouts
    ├── pages/            # Inertia page components
    ├── types/            # TypeScript type definitions
    └── lib/              # Utility functions

database/
├── migrations/
├── seeders/
│   ├── RolesAndPermissionsSeeder.php
│   ├── AssignRolesToExistingUsersSeeder.php
│   └── ClientSeeder.php
└── factories/

specs/                     # Feature specifications
├── UNIFIED-SPEC.md
├── 001-timeslot-booking/
├── 002-client-provider-link/
├── 003-consolidate-booking-to-timeslot/
└── 004-modal-based-timeslot-creation/
```

## Development

### Running Tests

```bash
php artisan test
```

### Code Style

```bash
# PHP (Laravel Pint)
./vendor/bin/pint

# TypeScript/React
npm run lint
```

## Documentation

- [Spatie Permissions Setup](docs/SPATIE_PERMISSIONS.md)
- [Calendar Client Display](docs/CALENDAR_CLIENT_DISPLAY.md)
- [Unified Specification](specs/UNIFIED-SPEC.md)

## Official Documentation

Documentation for all Laravel starter kits can be found on the [Laravel website](https://laravel.com/docs/starter-kits).

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## License

BookSpot is open-sourced software licensed under the [MIT license](LICENSE).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## License

The Laravel + React starter kit is open-sourced software licensed under the MIT license.
