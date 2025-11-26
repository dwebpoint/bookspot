# Laravel 12 Expert Developer Skill

A custom Claude Code skill/agent for expert Laravel 12 development assistance on the BookSpot project.

## Quick Start

### Using the Slash Command (Recommended)

```bash
/laravel How do I add a new field to the Timeslot model?
/laravel Create a policy for the Client model with provider ownership checks
/laravel Show me how to implement a modal form for creating clients
```

### Using the Agent Directly

For more complex, multi-step tasks, you can invoke the agent:

```
@agent laravel-expert
Help me implement a feature for service providers to set recurring timeslots (weekly/monthly patterns).
```

## What It Helps With

### Backend (Laravel 12)
- ✅ Controller implementation with authorization
- ✅ Eloquent models, relationships, and scopes
- ✅ Policy-based authorization (RBAC)
- ✅ Form Request validation
- ✅ Database migrations and seeders
- ✅ PHPUnit feature tests
- ✅ Spatie Permission integration

### Frontend (React 19 + TypeScript)
- ✅ Typed Inertia components
- ✅ shadcn/ui component usage
- ✅ Modal-based forms
- ✅ Type-safe routing with Wayfinder
- ✅ Form state management with useForm
- ✅ Error handling and validation display

### Full-Stack Features
- ✅ End-to-end type safety
- ✅ Authorization patterns (policies + middleware)
- ✅ Testing strategies (RefreshDatabase, role-based tests)
- ✅ Code quality (Pint, ESLint, Prettier)
- ✅ Performance optimization (eager loading, query scopes)

## Example Use Cases

### 1. Creating a New Feature

**Question:**
```
/laravel I need to add a "notes" field to timeslots that only providers can edit
```

**Response includes:**
- Migration for adding the column
- Model update with fillable property
- Policy update with authorization logic
- Form Request validation rules
- TypeScript interface update
- React component changes
- Feature test examples

### 2. Authorization Help

**Question:**
```
/laravel How do I ensure only the provider who owns a timeslot can assign clients to it?
```

**Response includes:**
- Policy method implementation
- Controller authorization check
- Test cases for authorization
- Error handling in frontend

### 3. Component Development

**Question:**
```
/laravel Create a modal dialog for editing timeslot duration
```

**Response includes:**
- TypeScript component with typed props
- shadcn/ui Dialog usage
- Inertia form handling
- Validation error display
- Success/error feedback

### 4. Testing Guidance

**Question:**
```
/laravel Write tests for the BookingController cancel method
```

**Response includes:**
- Feature test setup with RefreshDatabase
- Role-based test scenarios
- Authorization tests
- Database assertions
- Edge case coverage

## Knowledge Base

The agent has deep knowledge of:

### BookSpot Architecture
- Core models: User, Timeslot, ProviderClient
- Role system: admin, service_provider, client
- Permission structure and checks
- Timeslot lifecycle: available → booked → completed/cancelled
- Provider-client many-to-many relationships

### Project Patterns
- Modal-based inline operations (Calendar page)
- Calendar-first workflow for timeslot management
- Type-safe backend → frontend prop passing
- Authorization: policies + middleware + ownership
- Validation: Form Requests with typed rules

### Tech Stack
- **Backend**: Laravel 12, PHP 8.4+, Spatie Permissions, Fortify
- **Frontend**: React 19, TypeScript 5.7+, Inertia.js 2.x, shadcn/ui
- **Database**: Migrations, Eloquent ORM, foreign keys
- **Testing**: PHPUnit, RefreshDatabase trait
- **Build**: Vite 7.x, Laravel Wayfinder

## Best Practices Enforced

The agent always follows BookSpot's best practices:

### PHP/Laravel
- ✅ Strict types (`declare(strict_types=1);`)
- ✅ Typed properties (PHP 8.4+)
- ✅ Form Requests for validation
- ✅ Policies for authorization
- ✅ Eager loading to avoid N+1
- ✅ Query scopes for reusable queries
- ✅ Foreign key constraints

### React/TypeScript
- ✅ Strict TypeScript mode
- ✅ Functional components with hooks
- ✅ Typed Inertia props (interfaces)
- ✅ Tailwind classes (no inline styles)
- ✅ shadcn/ui component patterns
- ✅ Error handling and loading states

### Testing
- ✅ RefreshDatabase trait
- ✅ Role-based test scenarios
- ✅ Authorization tests (403 for unauthorized)
- ✅ Validation tests (success + failure)
- ✅ Factory usage for test data

## File Locations

The skill has been installed in two places:

1. **Agent Definition**: `.github/agents/laravel-expert.agent.md`
   - Comprehensive knowledge base
   - Code examples and patterns
   - BookSpot-specific context

2. **Slash Command**: `.claude/commands/laravel.md`
   - Quick invocation via `/laravel`
   - Concise prompt for focused help
   - References the main agent

## Tips for Best Results

1. **Be Specific**: Instead of "how do I add validation?", ask "how do I validate that timeslot start_time is in the future and during business hours?"

2. **Include Context**: Mention the specific model, controller, or feature you're working on

3. **Ask for Tests**: Request test examples to ensure your implementation is solid

4. **Request Type Safety**: Ask for TypeScript types when working on frontend features

5. **Multi-Step Tasks**: For complex features, consider using the `/speckit.specify` workflow first, then use `/laravel` for implementation details

## Integration with SpecKit Workflow

The Laravel Expert skill integrates seamlessly with the SpecKit workflow:

```bash
# 1. Specify the feature
/speckit.specify

# 2. Clarify requirements
/speckit.clarify

# 3. Plan implementation
/speckit.plan

# 4. Get Laravel-specific help during implementation
/laravel How do I implement the timeslot recurrence pattern?

# 5. Generate tasks
/speckit.tasks

# 6. Implement with Laravel expertise
/speckit.implement
```

## Examples from BookSpot Codebase

The agent references real patterns from your codebase:

- **Timeslot Model**: [app/Models/Timeslot.php](../app/Models/Timeslot.php)
- **Calendar Controller**: [app/Http/Controllers/CalendarController.php](../app/Http/Controllers/CalendarController.php)
- **Calendar Page**: [resources/js/pages/Calendar/Index.tsx](../resources/js/pages/Calendar/Index.tsx)
- **Timeslot Policy**: [app/Policies/TimeslotPolicy.php](../app/Policies/TimeslotPolicy.php)
- **Permissions Seeder**: [database/seeders/RolesAndPermissionsSeeder.php](../database/seeders/RolesAndPermissionsSeeder.php)

## Troubleshooting

**Slash command not found?**
- Restart Claude Code to reload custom commands
- Check that `.claude/commands/laravel.md` exists

**Agent not responding as expected?**
- Be more specific in your question
- Reference specific files or features
- Ask for examples from the BookSpot codebase

**Need more context?**
- Check [CLAUDE.md](../CLAUDE.md) for project overview
- Review [docs/SPATIE_PERMISSIONS.md](SPATIE_PERMISSIONS.md) for RBAC details
- Look at existing specs in `specs/` directory

## Development Commands Reference

```bash
# Setup
composer setup

# Development
composer dev
composer dev:ssr

# Testing
php artisan test
php artisan test --filter TestName

# Code Quality
./vendor/bin/pint
npm run lint
npm run types
npm run format

# Permissions
php artisan permission:cache-reset
php artisan db:seed --class=RolesAndPermissionsSeeder

# Database
php artisan migrate
php artisan db:seed
php artisan migrate:fresh --seed
```

---

**Ready to build amazing features with Laravel 12 + React 19 + Inertia.js!** 🚀

Use `/laravel` for quick questions or `@agent laravel-expert` for comprehensive guidance.
