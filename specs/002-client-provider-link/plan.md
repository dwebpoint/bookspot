# Implementation Plan: Client-Provider Relationship Management

**Branch**: `002-client-provider-link` | **Date**: 2025-11-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-client-provider-link/spec.md`

## Summary

Implement a many-to-many relationship between service providers and clients, enabling providers to create and manage their own client base. When a provider creates a client account, the system automatically establishes a relationship between them. Clients can be linked to multiple providers and see timeslots from all linked providers in a unified calendar.

**Technical Approach**: Create a `provider_client` pivot table for the many-to-many relationship, update the calendar controller to filter timeslots by linked providers, add client management pages for providers, and ensure all booking operations validate the provider-client relationship.

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 12), TypeScript (React 19)  
**Primary Dependencies**: Laravel 12, Inertia.js 2.x, Laravel Fortify, React 19, shadcn/ui, Radix UI, Tailwind CSS 4  
**Storage**: MySQL/PostgreSQL (Laravel Eloquent ORM)  
**Testing**: PHPUnit (backend feature tests), Laravel's RefreshDatabase trait  
**Target Platform**: Web application (modern browsers)  
**Project Type**: Web (Laravel + React SPA via Inertia.js)  
**Constraints**: Email must be unique identifier for clients, automatic relationship linking on client creation  
**Scale/Scope**: Extends 001-timeslot-booking with client relationship management

## Constitution Check

*GATE: Must pass before implementation. Re-check after design changes.*

### ✅ Feature-First Development
- Clear user-facing benefit: Enables providers to build and manage their own client base
- Self-contained feature with minimal dependencies (extends existing User and Timeslot models)
- Specification document exists (spec.md)
- Can be independently tested: provider creates client → client sees provider's timeslots

### ✅ Full-Stack Coherence
- Backend will define API contracts via Inertia controllers (ClientController)
- TypeScript interfaces will be created for client types and provider-client relationships
- Backend validation (StoreClientRequest) will match frontend form validation
- Database migration creates `provider_client` pivot table with proper foreign keys

### ✅ Test-First for Critical Paths (NON-NEGOTIABLE)
- Feature tests required for:
  - Provider creating a client (authentication + data mutation)
  - Automatic relationship linking (data integrity)
  - Calendar filtering by linked providers (authorization)
  - Relationship removal with booking cancellation (cascade operations)
  - Duplicate email prevention (data integrity)
- **Note**: Tasks.md currently marks tests as "not explicitly requested" - this must be corrected

### ✅ Type Safety Across the Stack
- All React components will use TypeScript with strict mode
- Client types defined in `resources/js/types/client.ts`
- All PHP methods will declare parameter and return types
- ProviderClient model and policy with typed methods

### ✅ Component Reusability
- ClientCard component for displaying client information
- ClientProviders component for showing linked providers
- Controllers follow single-responsibility principle
- Shared logic in ProviderClient model methods

### ✅ Database Integrity
- All schema changes via migrations (`provider_client` pivot table)
- Foreign keys: provider_id → users.id, client_id → users.id with CASCADE
- Unique constraint on (provider_id, client_id) to prevent duplicates
- Form validation before persistence using StoreClientRequest

## Project Structure

### Documentation (this feature)

```text
specs/002-client-provider-link/
├── spec.md              # Feature specification (exists)
├── plan.md              # This file
├── tasks.md             # Implementation task breakdown (exists)
└── checklists/
    └── requirements.md  # Specification quality checklist (exists)
```

### Source Code (repository root)

```text
# Files created/modified for this feature
app/
├── Models/
│   ├── User.php (extend with provider-client relationships)
│   └── ProviderClient.php (new - pivot model)
├── Http/
│   ├── Controllers/
│   │   └── Provider/
│   │       └── ClientController.php (new)
│   └── Requests/
│       └── StoreClientRequest.php (new)
├── Policies/
│   └── ProviderClientPolicy.php (new)

database/
├── migrations/
│   └── YYYY_MM_DD_create_provider_client_table.php (new)
└── seeders/
    └── ClientSeeder.php (new)

resources/js/
├── pages/
│   └── Provider/
│       └── Clients/
│           ├── Index.tsx (new)
│           └── Create.tsx (new)
├── components/
│   ├── ClientCard.tsx (new)
│   └── ClientProviders.tsx (new)
└── types/
    └── client.ts (new)
```

## Complexity Tracking

> **No constitution violations identified.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Integration with Existing Features

### Modified Controllers
- `CalendarController`: Filter timeslots by client's linked providers
- `BookingController`: Validate provider-client relationship before booking
- `Provider/TimeslotController`: Validate client is linked before assignment

### Modified Frontend
- `Calendar/Index.tsx`: Provider filter dropdown for multi-provider clients
- `app-sidebar.tsx`: Add "Clients" menu item for providers

---

## Next Steps

1. **Complete Outstanding Tasks** (`tasks.md`):
   - T035: Create RemoveClientRequest form request
   - T039: Warning dialog for future bookings
   - T048: Email notification for new client creation (FR-006 requires this)

2. **Add Feature Tests**:
   - Test provider client creation
   - Test automatic relationship linking
   - Test duplicate email handling
   - Test calendar filtering by linked providers
   - Test relationship removal with booking cancellation

3. **Documentation**:
   - Update CLAUDE.md with provider-client patterns
   - Create TESTING.md with manual test scenarios

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-22 | Initial plan created |
| 1.0.1 | 2025-12-03 | Added Constitution Check, aligned with spec |
