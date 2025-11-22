# Tasks: Client-Provider Relationship Management

**Feature**: 002-client-provider-link  
**Input**: Design documents from `/specs/002-client-provider-link/`  
**Prerequisites**: spec.md (required for user stories)

**Tests**: Not explicitly requested in specification - focusing on implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `app/`, `database/`, `routes/`
- **Frontend**: `resources/js/`
- Laravel + React + Inertia.js architecture

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database structure for provider-client relationships

- [X] T001 Create migration for provider_client pivot table in database/migrations/YYYY_MM_DD_HHMMSS_create_provider_client_table.php
- [X] T002 [P] Add provider-client relationship methods to User model in app/Models/User.php
- [X] T003 [P] Create ProviderClientPolicy for authorization in app/Policies/ProviderClientPolicy.php

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create ProviderClient model in app/Models/ProviderClient.php with relationships and validation
- [X] T005 Register ProviderClientPolicy in app/Providers/AppServiceProvider.php
- [X] T006 Create StoreClientRequest form request in app/Http/Requests/StoreClientRequest.php
- [X] T007 Update CalendarController to filter timeslots by client's linked providers in app/Http/Controllers/CalendarController.php
- [X] T008 Update BookingController to validate provider-client relationship in app/Http/Controllers/BookingController.php

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Service Provider Creates Client Account (Priority: P1) 🎯 MVP

**Goal**: Enable service providers to create client accounts with automatic relationship linking

**Independent Test**: Log in as service provider, create new client account, verify client appears in provider's client list and relationship exists in database

### Implementation for User Story 1

- [X] T009 [P] [US1] Create ClientController in app/Http/Controllers/Provider/ClientController.php with store method
- [X] T010 [P] [US1] Add provider client routes in routes/web.php (index, create, store)
- [X] T011 [P] [US1] Create client TypeScript types in resources/js/types/client.ts
- [X] T012 [US1] Implement client creation logic with auto-linking in ClientController@store
- [X] T013 [US1] Handle duplicate email detection and relationship creation in ClientController@store
- [X] T014 [P] [US1] Create Client/Create.tsx page in resources/js/pages/Provider/Clients/Create.tsx
- [X] T015 [P] [US1] Add client creation form validation on frontend
- [X] T016 [US1] Add route mapping for provider.clients.* in resources/js/lib/route-helper.ts
- [X] T017 [US1] Update HandleInertiaRequests to share provider's client count if applicable in app/Http/Middleware/HandleInertiaRequests.php

**Checkpoint**: At this point, providers can create clients and relationships are automatically established

---

## Phase 4: User Story 2 - Service Provider Views Their Client List (Priority: P1) 🎯 MVP

**Goal**: Enable service providers to view and manage their client list

**Independent Test**: Create multiple clients under a provider, verify all appear in filterable client list with correct information

### Implementation for User Story 2

- [X] T018 [US2] Add index method to ClientController in app/Http/Controllers/Provider/ClientController.php
- [X] T019 [P] [US2] Create Client/Index.tsx page in resources/js/pages/Provider/Clients/Index.tsx
- [X] T020 [P] [US2] Add client list with search/filter functionality in Client/Index.tsx
- [X] T021 [P] [US2] Create ClientCard component in resources/js/components/ClientCard.tsx
- [X] T022 [US2] Add pagination support for client list in ClientController@index
- [X] T023 [US2] Add "Clients" menu item to provider navigation in resources/js/components/app-sidebar.tsx
- [X] T024 [US2] Create empty state component for no clients in resources/js/pages/Provider/Clients/Index.tsx

**Checkpoint**: At this point, providers can view and search their complete client list

---

## Phase 5: User Story 3 - Client Belongs to Multiple Providers (Priority: P2)

**Goal**: Support clients being linked to multiple service providers

**Independent Test**: Have two providers create/link same client by email, verify client sees timeslots from both providers in calendar

### Implementation for User Story 3

- [X] T025 [US3] Update CalendarController to load timeslots from all linked providers in app/Http/Controllers/CalendarController.php
- [X] T026 [US3] Add provider filter dropdown to Calendar view in resources/js/pages/Calendar/Index.tsx
- [X] T027 [P] [US3] Create ClientProviders component showing linked providers in resources/js/components/ClientProviders.tsx
- [X] T028 [US3] Update StoreClientRequest to handle existing client linking in app/Http/Requests/StoreClientRequest.php
- [X] T029 [US3] Add method to check if client exists and create relationship only in ClientController@store
- [X] T030 [P] [US3] Update Provider/Clients/Index to show if client is shared with note in resources/js/pages/Provider/Clients/Index.tsx
- [X] T031 [US3] Add scopes to Timeslot model for filtering by client's providers in app/Models/Timeslot.php

**Checkpoint**: At this point, clients can have multiple provider relationships and see all their timeslots

---

## Phase 6: User Story 4 - Service Provider Manages Client Relationships (Priority: P2)

**Goal**: Enable providers to remove client relationships with proper cleanup

**Independent Test**: Link client to provider, remove relationship, verify client no longer sees provider's timeslots and future bookings are cancelled

### Implementation for User Story 4

- [X] T032 [US4] Add destroy method to ClientController in app/Http/Controllers/Provider/ClientController.php
- [X] T033 [US4] Implement relationship removal with booking cancellation logic in ClientController@destroy
- [X] T034 [P] [US4] Add confirmation dialog for client removal in resources/js/pages/Provider/Clients/Index.tsx
- [ ] T035 [P] [US4] Create RemoveClientRequest form request in app/Http/Requests/RemoveClientRequest.php
- [X] T036 [US4] Add DELETE route for provider.clients.destroy in routes/web.php
- [X] T037 [US4] Update route-helper.ts with client removal route in resources/js/lib/route-helper.ts
- [X] T038 [US4] Add transaction handling for relationship removal in ClientController@destroy
- [ ] T039 [P] [US4] Show warning if client has future bookings before removal in resources/js/pages/Provider/Clients/Index.tsx

**Checkpoint**: At this point, providers can remove client relationships with proper data cleanup

---

## Phase 7: Integration & Enhancement

**Purpose**: Integration with existing features and UX improvements

- [X] T040 [P] Update Provider/Timeslots/Index to filter by specific client in resources/js/pages/Provider/Timeslots/Index.tsx
- [X] T041 Update assignClient method to validate provider-client relationship in app/Http/Controllers/Provider/TimeslotController.php
- [ ] T042 [P] Add client profile page showing linked providers in resources/js/pages/Client/Profile.tsx
- [X] T043 Create ClientSeeder for test data in database/seeders/ClientSeeder.php
- [ ] T044 Update TimeslotBookingSeeder to include provider-client relationships in database/seeders/TimeslotBookingSeeder.php
- [X] T045 [P] Add client count badge to provider navigation in resources/js/components/nav-main.tsx
- [X] T046 Update Bookings/Index to show provider name for each booking in resources/js/pages/Bookings/Index.tsx (already implemented)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T047 [P] Update spec.md documentation to mark as implemented in specs/002-client-provider-link/spec.md
- [ ] T048 [P] Add email notification for new client creation (optional) in app/Notifications/ClientCreated.php
- [ ] T049 Add indexes for performance on provider_client table in database/migrations
- [ ] T050 Add client relationship validation to existing authorization policies
- [ ] T051 [P] Create TESTING.md with manual test scenarios in specs/002-client-provider-link/TESTING.md
- [ ] T052 Update .github/copilot-instructions.md with provider-client relationship patterns

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Integration (Phase 7)**: Depends on US1 and US2 being complete
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Can work in parallel with US1
- **User Story 3 (P2)**: Depends on US1 and US2 for UI integration
- **User Story 4 (P2)**: Depends on US1 and US2 for base functionality

### Within Each User Story

- Backend models and controllers before frontend pages
- Routes and form requests early in the story
- Type definitions before components
- Core functionality before UI enhancements
- Story complete before moving to next priority

### Parallel Opportunities

#### Phase 1 (Setup)
```bash
Task T002: User model relationships
Task T003: ProviderClientPolicy creation
```

#### Phase 2 (Foundational) - After T004 completes
```bash
Task T006: StoreClientRequest
Task T007: CalendarController update
Task T008: BookingController update
```

#### User Story 1
```bash
Task T009: ClientController creation
Task T010: Route definitions
Task T011: TypeScript types
```
Then after T012 (core logic):
```bash
Task T014: Create.tsx page
Task T015: Form validation
Task T016: Route helper update
```

#### User Story 2
```bash
Task T019: Index.tsx page
Task T020: Search/filter UI
Task T021: ClientCard component
Task T024: Empty state
```

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch these together:
Task T009: "Create ClientController in app/Http/Controllers/Provider/ClientController.php"
Task T010: "Add provider client routes in routes/web.php"
Task T011: "Create client TypeScript types in resources/js/types/client.ts"

# After T012 (core logic) completes, launch these together:
Task T014: "Create Client/Create.tsx page"
Task T015: "Add form validation"
Task T016: "Add route mapping"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only - Both P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Client Creation)
4. Complete Phase 4: User Story 2 (Client List)
5. **STOP and VALIDATE**: Test client creation and listing independently
6. Deploy/demo if ready

This gives providers the ability to build and manage their client base - immediate value!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (Tasks T001-T008)
2. Add User Story 1 → Test independently → Providers can create clients ✅
3. Add User Story 2 → Test independently → Providers can view/search clients ✅
4. **MVP COMPLETE** - Deploy and get feedback
5. Add User Story 3 → Test independently → Multi-provider support ✅
6. Add User Story 4 → Test independently → Relationship management ✅
7. Add Integration → Enhance existing features
8. Polish → Final improvements

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T008)
2. Once Foundational is done:
   - Developer A: User Story 1 (T009-T017) - Client Creation
   - Developer B: User Story 2 (T018-T024) - Client List
3. Both can work simultaneously since they touch different files
4. Then proceed to US3 and US4 in parallel if team size allows

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability (US1, US2, US3, US4)
- Each user story should be independently completable and testable
- Migration must run before any model/controller work (T001 is critical)
- Provider-client relationship is many-to-many via pivot table
- Existing features (calendar, bookings) need updates to respect relationships
- Email notifications (T048) are optional/nice-to-have
- Focus on P1 stories first for quickest value delivery
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Total Tasks: 52

- **Setup**: 3 tasks
- **Foundational**: 5 tasks (BLOCKING)
- **User Story 1 (P1)**: 9 tasks (Client Creation)
- **User Story 2 (P1)**: 7 tasks (Client List)
- **User Story 3 (P2)**: 7 tasks (Multi-Provider)
- **User Story 4 (P2)**: 8 tasks (Relationship Management)
- **Integration**: 7 tasks
- **Polish**: 6 tasks

**Estimated MVP** (US1 + US2): 24 tasks (Setup + Foundational + US1 + US2)
