<!--
  Sync Impact Report
  ===================
  Version change: 0.0.0 → 1.0.0 (MAJOR: initial ratification)
  Modified principles: N/A (initial version)
  Added sections:
    - Core Principles (7 principles)
    - Technology Constraints
    - Development Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md — ✅ compatible (Constitution Check section exists)
    - .specify/templates/spec-template.md — ✅ compatible (user stories + FR structure aligns)
    - .specify/templates/tasks-template.md — ✅ compatible (phase structure aligns)
    - .specify/templates/checklist-template.md — ✅ compatible (no principle references)
    - .specify/templates/agent-file-template.md — ✅ compatible (no principle references)
  Follow-up TODOs: None
-->

# BookSpot Constitution

## Core Principles

### I. Unified Specification

All feature requirements MUST be maintained in a single unified specification
document (`specs/UNIFIED-SPEC.md`) rather than scattered across individual
feature-specific spec files. New features MUST be appended as user stories
and functional requirements to the unified spec. Individual feature folders
(`specs/###-feature/`) MAY contain implementation plans, task breakdowns, and
architectural notes, but the canonical requirements source is always the
unified spec.

**Rationale**: A single source of truth prevents specification drift, eliminates
contradictions between feature specs, and makes cross-feature impact analysis
trivial.

### II. Full-Stack Coherence

Every feature MUST maintain a clear contract between Laravel backend and React
frontend via Inertia.js. Controller props MUST be typed in both PHP
(`Inertia::render` calls) and TypeScript (page component interfaces). Route
changes MUST be reflected through Laravel Wayfinder type-safe route generation.
No separate REST API layer — Inertia is the bridge.

**Rationale**: Type mismatches between backend and frontend are the most common
source of runtime bugs in full-stack applications. Inertia + Wayfinder enforce
this contract at build time.

### III. Test-First for Critical Paths (NON-NEGOTIABLE)

Tests MUST be written before implementation for:
- Authentication and authorization (role checks, policy enforcement)
- Data modification operations (create, update, delete)
- RBAC permission boundaries (role-based access control)
- Booking state transitions (available → booked → completed)

Red-Green-Refactor: write failing test → implement → refactor. PHPUnit feature
tests are the primary testing mechanism. Every change MUST have corresponding
test coverage for the paths listed above.

**Rationale**: These are the paths where bugs cause data corruption, security
holes, or broken access control. Testing after implementation risks shipping
untested edge cases.

### IV. Database Integrity

All schema changes MUST use Laravel migrations — never modify the database
directly. Foreign keys MUST enforce referential integrity. Unique constraints
MUST prevent duplicate records (e.g., provider-client pivot). Eloquent ORM
MUST be used for all queries; raw SQL is prohibited unless no Eloquent/Query
Builder alternative exists. Eager loading MUST be used to prevent N+1 queries.

**Rationale**: BookSpot handles booking state that affects real appointments.
Data corruption in timeslot status or provider-client relationships directly
impacts users.

### V. Calendar-First UX

The calendar page (`/calendar`) is the primary interface for all roles.
Timeslot management (create, assign, cancel, delete, edit duration) MUST
happen via modal dialogs on the calendar — no separate CRUD pages. All
timeslot operations MUST redirect back to `/calendar` to maintain user
context. The `/timeslots` page serves as a secondary list view only.

**Rationale**: Context-switching between pages breaks workflow. Users
manage appointments spatially (calendar) not as list items.

### VI. Type Safety Across Stack

PHP MUST use explicit return types, parameter types, and constructor
property promotion (PHP 8.4). TypeScript MUST run in strict mode — `any`
is prohibited without written justification. Enums MUST be used instead
of string/integer constants. Models MUST declare `$fillable` or `$guarded`
and use cast definitions for all non-string attributes.

**Rationale**: Loose typing causes silent failures that surface as
production bugs. Strict typing catches errors at compile/analysis time.

### VII. Simplicity (YAGNI)

Features MUST NOT be over-engineered. No abstractions for one-time
operations. No error handling for impossible scenarios. No configuration
for hypothetical future requirements. Code MUST be the minimum needed for
current requirements as defined in the unified spec. If a requirement is
not in `specs/UNIFIED-SPEC.md`, it does not exist.

**Rationale**: Complexity is the primary maintenance cost. Every
abstraction layer adds cognitive load and potential failure points.

## Technology Constraints

- **Backend**: Laravel 13, PHP 8.4+, Spatie Laravel Permission, Laravel Fortify
- **Frontend**: React 19, TypeScript 5.7+, Tailwind CSS 4.x, shadcn/ui, Radix UI
- **Bridge**: Inertia.js 2.x with Laravel Wayfinder for type-safe routing
- **Build**: Vite 7.x
- **Testing**: PHPUnit with `RefreshDatabase` trait, SQLite in-memory for tests
- **Database**: Configurable (SQLite for dev/test, production-appropriate for deploy)
- **Code Quality**: Laravel Pint (PHP), ESLint + Prettier (TypeScript/React)
- **RBAC**: Spatie Permission package — three roles: `admin`, `service_provider`, `client`

Dependencies MUST NOT be added without explicit approval. No deprecated Laravel
patterns (facade overuse, logic-heavy views, class-based components).

## Development Workflow

1. **Specify**: New features are added to `specs/UNIFIED-SPEC.md` as user stories
   with acceptance scenarios and functional requirements
2. **Plan**: Implementation plans go in `specs/###-feature/plan.md` referencing
   the unified spec's user stories
3. **Task**: Task breakdowns go in `specs/###-feature/tasks.md`
4. **Implement**: Code follows Laravel conventions (thin controllers, Form Requests
   for validation, Policies for authorization, Services/Actions for business logic)
5. **Test**: PHPUnit tests MUST pass before merge. CI handles formatting (Pint),
   linting (ESLint), and type checking
6. **Quality gates**: `vendor/bin/pint --dirty` for PHP, `npm run lint` and
   `npm run types` for frontend

All PRs MUST verify compliance with these principles. Complexity beyond what
the unified spec requires MUST be justified in the PR description.

## Governance

This constitution supersedes all other development practices for the BookSpot
project. All code reviews and PRs MUST verify compliance with the principles
above.

**Amendment procedure**:
1. Propose amendment with rationale
2. Document the change in this file
3. Update version according to semver:
   - MAJOR: Principle removed or incompatibly redefined
   - MINOR: New principle or section added, material expansion
   - PATCH: Clarifications, wording, typo fixes
4. Update `LAST_AMENDED_DATE` to the amendment date
5. Propagate changes to dependent templates if principle names or structure change

**Compliance review**: Every feature plan (`specs/###-feature/plan.md`) MUST
include a Constitution Check section verifying alignment with these principles
before implementation begins.

**Runtime guidance**: See `CLAUDE.md` for detailed development commands,
architecture documentation, and project-specific patterns.

**Version**: 1.0.0 | **Ratified**: 2026-03-12 | **Last Amended**: 2026-03-12
