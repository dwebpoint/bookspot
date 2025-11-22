<!--
Sync Impact Report:
- Version: Initial → 1.0.0
- Reason: Initial constitution ratification for Bookspot project
- Modified principles: None (initial creation)
- Added sections: All core principles, Technical Stack, Security Requirements, Development Workflow, Governance
- Templates requiring updates:
  ✅ spec-template.md - Reviewed, aligns with constitution (user stories, testing requirements)
  ✅ plan-template.md - Reviewed, aligns with constitution (technical context, constitution check gate)
  ✅ tasks-template.md - Reviewed, aligns with constitution (test tasks optional, file organization)
- Follow-up TODOs: None
-->

# Bookspot Constitution

## Core Principles

### I. Feature-First Development

Every feature must deliver tangible user value and be independently testable. Features are developed as cohesive units with clear boundaries, enabling modular development and deployment.

**Requirements**:
- Each feature must have a clear user-facing benefit
- Features must be self-contained with minimal cross-dependencies
- Each feature requires a specification document before implementation
- Features must be implementable and testable independently

**Rationale**: Bookspot is built as a modern web application where users expect coherent, complete functionality. Feature-first development ensures we deliver value incrementally while maintaining code quality and testability.

### II. Full-Stack Coherence

Backend and frontend must be developed in tandem with clear contracts. The backend (Laravel/PHP) owns business logic and data; the frontend (React/TypeScript) owns presentation and user interaction.

**Requirements**:
- Backend routes and controllers define API contracts before frontend implementation
- Inertia.js props must be typed in TypeScript
- Backend validation rules must match frontend form validation
- Database schema changes must be accompanied by corresponding model updates

**Rationale**: Inertia.js bridges Laravel and React, requiring tight coordination between layers. Misalignment between backend and frontend causes runtime errors that TypeScript cannot catch. Clear contracts prevent integration issues.

### III. Test-First for Critical Paths (NON-NEGOTIABLE)

Critical user paths (authentication, data modification, authorization) require tests before implementation. Tests must be written, approved, fail initially, then pass after implementation.

**Requirements**:
- Feature tests required for all authenticated routes
- Security-related features (auth, permissions) require tests first
- Database mutations require feature tests
- Test coverage for new features must not decrease overall coverage

**Rationale**: Laravel applications handle sensitive user data. Test-first development for critical paths prevents security vulnerabilities and data corruption. The existing test suite (PHPUnit, RefreshDatabase) supports this workflow.

### IV. Type Safety Across the Stack

TypeScript must be used for all frontend code with strict mode enabled. Backend code must use PHP type declarations for all method signatures and properties.

**Requirements**:
- All React components must be typed (no `any` types without justification)
- Inertia props must have TypeScript interfaces
- PHP methods must declare parameter and return types
- Laravel Wayfinder routes must use type-safe route generation

**Rationale**: Type safety catches errors at compile time rather than runtime. TypeScript and PHP 8.2+ provide strong type systems that prevent entire classes of bugs. The cost of strict typing is offset by reduced debugging time.

### V. Component Reusability

UI components must be reusable, composable, and follow the shadcn/ui architecture. Backend code must follow Laravel conventions and avoid duplication.

**Requirements**:
- React components in `resources/js/components/` must be reusable
- Radix UI and shadcn/ui patterns must be followed
- Laravel controllers must use single-responsibility principle
- Shared backend logic must be extracted into services or actions

**Rationale**: Bookspot uses shadcn/ui and Radix UI for consistent, accessible components. These libraries are designed for composition and reuse. Following established patterns reduces maintenance burden and ensures UI consistency.

### VI. Database Integrity

All database schema changes must use migrations. Foreign keys must enforce referential integrity. Data must be validated before persistence.

**Requirements**:
- No direct schema modifications (migrations only)
- Foreign key constraints required for all relationships
- Eloquent models must define fillable/guarded properties
- Form requests must validate data before controller processing

**Rationale**: Laravel migrations provide version control for database schema. Foreign keys prevent orphaned records. Validation at the request layer ensures data integrity before business logic executes.

## Technical Stack Standards

### Required Technologies

**Backend**:
- PHP 8.3+ with strict types
- Laravel 12.x framework
- Laravel Fortify for authentication
- Inertia.js 2.x for server-side rendering bridge
- PHPUnit for testing

**Frontend**:
- React 19 with TypeScript 5.x
- Tailwind CSS 4.x for styling
- shadcn/ui and Radix UI for components
- Vite 5.x for build tooling
- ESLint and Prettier for code quality

**Development Tools**:
- Laravel Pint for PHP code styling
- Prettier with organize-imports plugin for frontend
- Git for version control
- Composer for PHP dependencies
- npm for JavaScript dependencies

### Technology Constraints

**MUST USE**:
- Inertia.js for all page rendering (no separate API/SPA architecture)
- Laravel Wayfinder for type-safe routing
- Eloquent ORM for database operations
- PHPUnit RefreshDatabase trait for feature tests

**MUST NOT USE**:
- Direct SQL queries (use Eloquent or Query Builder)
- Inline styles in React components (use Tailwind classes)
- Third-party authentication packages (use Laravel Fortify)
- Class-based React components (use functional components with hooks)

## Security Requirements

### Authentication & Authorization

**Requirements**:
- All authenticated routes must use `auth` middleware
- Email verification must be enabled for sensitive operations
- Two-factor authentication must be available to all users
- Password resets must use Laravel Fortify's secure token system
- Session configuration must use secure, httpOnly cookies

**Enforcement**:
- Feature tests must verify unauthorized access is blocked
- Middleware must be explicitly declared in routes
- Authorization logic must use Laravel Gates or Policies

### Data Protection

**Requirements**:
- User passwords must be hashed with bcrypt (default Laravel behavior)
- Sensitive data must not be logged
- CSRF protection must be enabled for all state-changing operations
- XSS protection via React's default escaping (no `dangerouslySetInnerHTML` without review)

## Development Workflow

### Feature Development Process

1. **Specification** (`/speckit.specify`): Define user stories and acceptance criteria
2. **Clarification** (`/speckit.clarify`): Resolve ambiguities and edge cases
3. **Planning** (`/speckit.plan`): Design technical approach and architecture
4. **Task Breakdown** (`/speckit.tasks`): Create implementation task list
5. **Implementation** (`/speckit.implement`): Execute tasks with tests
6. **Review**: Code review for compliance and quality
7. **Merge**: Integrate to main branch after approval

### Code Quality Gates

**Pre-Implementation**:
- Feature specification must exist in `.specify/features/`
- Constitution compliance check must pass
- Technical plan must be approved

**Pre-Commit**:
- ESLint and TypeScript compilation must succeed (frontend)
- Laravel Pint must format PHP code
- Prettier must format frontend code

**Pre-Merge**:
- All feature tests must pass
- Test coverage must not decrease
- No TypeScript `any` types without documented justification
- Code review approval from maintainer

### Branch Strategy

**Feature branches**: `###-feature-name` (e.g., `001-book-catalog`)
**Main branch**: `master` (production-ready code)
**Naming convention**: Three-digit issue number + kebab-case description

## Governance

### Constitution Authority

This constitution supersedes all other development practices and guidelines. In case of conflict between this document and external standards, this constitution takes precedence unless explicitly amended.

### Amendment Process

**Minor amendments** (clarifications, examples, non-semantic changes):
- Document proposed change in PR description
- Version bump: PATCH increment
- Approval: Single maintainer

**Major amendments** (new principles, removed constraints, architectural changes):
- Document rationale and migration impact
- Version bump: MAJOR or MINOR increment
- Approval: Project owner
- Migration plan: Required if existing code affected

### Compliance Review

**Every feature specification** must include a "Constitution Check" section verifying:
- Which principles apply to the feature
- How the feature satisfies each applicable principle
- Any approved deviations with justification

**Every code review** must verify:
- Tests exist for critical paths
- Type safety is maintained
- Security requirements are met
- Component reusability is followed

### Version History

**Version**: 1.0.0 | **Ratified**: 2025-11-22 | **Last Amended**: 2025-11-22

**Changes**:
- Initial constitution for Bookspot project
- Established six core principles for Laravel + React development
- Defined technical stack standards and security requirements
- Created development workflow and governance framework