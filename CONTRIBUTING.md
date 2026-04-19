# Contributing to BookSpot

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Table of contents

- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Running tests](#running-tests)
- [Code quality](#code-quality)
- [Branching & commits](#branching--commits)
- [Pull request process](#pull-request-process)

---

## Prerequisites

| Tool | Version |
|------|---------|
| PHP | 8.4+ |
| Composer | 2.x |
| Node.js | 20+ |
| DDEV | latest (recommended) |

## Local setup

### With DDEV (recommended)

```bash
git clone https://github.com/your-org/bookspot.git && cd bookspot
ddev start
ddev composer setup   # installs deps, copies .env, migrates, seeds, builds assets
ddev composer dev     # starts queue worker + Vite HMR
```

App runs at **https://bookspot.ddev.site**.

### Without DDEV

```bash
git clone https://github.com/your-org/bookspot.git && cd bookspot
composer install && npm install
cp .env.example .env
php artisan key:generate
# Edit .env: set DB_* variables to your local MariaDB/MySQL instance
php artisan migrate
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=AssignRolesToExistingUsersSeeder
php artisan db:seed --class=ClientSeeder   # demo data (optional)
npm run build
php artisan serve
```

### Demo credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Service provider | provider1@example.com | password |
| Service provider | provider2@example.com | password |
| Client | client1@example.com | password |
| Client | client2@example.com | password |

---

## Running tests

Tests use an in-memory SQLite database — no external database required.

```bash
php artisan test                          # full suite
php artisan test --compact               # compact output
php artisan test --filter=TestName       # single test or class
```

Every change **must** be accompanied by a new or updated test.

---

## Code quality

Run all checks before pushing:

```bash
# PHP static analysis (PHPStan / Larastan level 6)
vendor/bin/phpstan analyse --no-progress

# PHP formatting (Laravel Pint)
vendor/bin/pint

# TypeScript type check
npm run types

# ESLint
npm run lint

# Prettier
npm run format
```

CI runs all of these automatically on every PR.

---

## Branching & commits

- Branch off `main`: `git checkout -b feat/my-feature` or `fix/my-fix`
- Keep commits focused and atomic
- Use conventional commit messages where possible:
  - `feat: add calendar export`
  - `fix: cancel button not working on mobile`
  - `refactor: extract timeslot status logic`
  - `test: add booking cancellation test`
  - `docs: update CONTRIBUTING`

---

## Pull request process

1. Fork the repository and create your branch from `main`
2. Make your changes with accompanying tests
3. Run the full quality toolchain locally (see [Code quality](#code-quality))
4. Open a pull request — the PR template will guide you through the checklist
5. A maintainer will review; address any requested changes
6. Once approved and CI passes, your PR will be merged

For large features, consider opening an issue first to discuss the approach.
