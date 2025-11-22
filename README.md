# Laravel + React Starter Kit - BookSpot

## Introduction

Our React starter kit provides a robust, modern starting point for building Laravel applications with a React frontend using [Inertia](https://inertiajs.com).

Inertia allows you to build modern, single-page React applications using classic server-side routing and controllers. This lets you enjoy the frontend power of React combined with the incredible backend productivity of Laravel and lightning-fast Vite compilation.

This React starter kit utilizes React 19, TypeScript, Tailwind, and the [shadcn/ui](https://ui.shadcn.com) and [radix-ui](https://www.radix-ui.com) component libraries.

## Features

### 📅 Timeslot Booking System
- Monthly calendar view with available timeslots
- Service providers can create and manage timeslots
- Clients can book available timeslots
- Status tracking (available, booked, cancelled)

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

## Quick Start

### Installation

```bash
# Install dependencies
composer install
npm install

# Configure environment
cp .env.example .env
php artisan key:generate

# Set up database
php artisan migrate

# Seed roles and permissions (Spatie)
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=AssignRolesToExistingUsersSeeder

# Optional: Seed test data
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

- Timeslot Management: `view`, `create`, `update`, `delete`, `assign timeslots`
- Booking Management: `view`, `create`, `cancel bookings`
- Client Management: `view`, `create`, `update`, `delete clients`
- User Management: `view`, `create`, `update`, `delete users` (admin only)

### Migration Guide

See [MIGRATION_STEPS.md](MIGRATION_STEPS.md) for quick setup or [docs/SPATIE_PERMISSIONS.md](docs/SPATIE_PERMISSIONS.md) for detailed documentation.

## Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/          # Admin controllers
│   │   ├── Provider/       # Service provider controllers
│   │   ├── BookingController.php
│   │   └── CalendarController.php
│   ├── Middleware/
│   │   └── CheckRole.php   # Role verification middleware
│   └── Requests/           # Form request validation
├── Models/
│   ├── User.php           # User model with HasRoles trait
│   ├── Timeslot.php
│   ├── Booking.php
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
├── 001-timeslot-booking/
└── 002-client-provider-link/
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
- [Feature 001: Timeslot Booking](specs/001-timeslot-booking/spec.md)
- [Feature 002: Client-Provider Links](specs/002-client-provider-link/spec.md)

## Official Documentation

Documentation for all Laravel starter kits can be found on the [Laravel website](https://laravel.com/docs/starter-kits).

## Contributing

Thank you for considering contributing to our starter kit! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## License

The Laravel + React starter kit is open-sourced software licensed under the MIT license.
