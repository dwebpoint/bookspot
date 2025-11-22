# Feature Specification: Client-Provider Relationship Management

**Feature Branch**: `002-client-provider-link`  
**Created**: 2025-11-22  
**Status**: Draft  
**Input**: User description: "Client can have many ServiceProvider. When ServiceProvider create Client, create reference to this ServiceProvider automatically"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Service Provider Creates Client Account (Priority: P1)

A service provider creates a new client account, and the system automatically establishes a relationship between them, allowing the provider to manage that client's bookings.

**Why this priority**: This is the foundational capability that enables service providers to build their client base within the system. Without this, providers cannot onboard their clients for booking management.

**Independent Test**: Can be fully tested by logging in as a service provider, creating a new client account, and verifying that the client appears in the provider's client list with an established relationship. Delivers immediate value as a client onboarding system.

**Acceptance Scenarios**:

1. **Given** a service provider is logged in, **When** they create a new client account with name and email, **Then** the system creates the client and automatically links them to this provider
2. **Given** a service provider has created a client, **When** they view their client list, **Then** they see the newly created client with their contact information
3. **Given** a service provider creates a client that already exists in the system, **When** the system detects the existing email, **Then** it establishes a relationship without creating a duplicate account
4. **Given** a client account is created by a service provider, **When** the client logs in for the first time, **Then** they can see timeslots from their linked provider(s)

---

### User Story 2 - Service Provider Views Their Client List (Priority: P1)

A service provider can view all clients they have created or are linked to, making it easy to manage their client relationships and assign timeslots.

**Why this priority**: Essential for providers to know which clients they can assign to timeslots. This enables the manual assignment feature that already exists in the system.

**Independent Test**: Can be fully tested by creating multiple clients under a provider account and verifying they all appear in a filterable, searchable client list. Delivers value as a client relationship management tool.

**Acceptance Scenarios**:

1. **Given** a service provider has multiple clients, **When** they access the clients page, **Then** they see a list of all their linked clients with names and email addresses
2. **Given** a service provider views their client list, **When** they search for a specific client by name or email, **Then** the list filters to show matching results
3. **Given** a service provider selects a client from the list, **When** they view client details, **Then** they see booking history and upcoming appointments for that client
4. **Given** a service provider has no clients yet, **When** they access the clients page, **Then** they see an empty state with a prompt to create their first client

---

### User Story 3 - Client Belongs to Multiple Providers (Priority: P2)

A client can be linked to multiple service providers, allowing them to book appointments with different providers who have added them to their client lists.

**Why this priority**: Increases system flexibility and real-world applicability, but the core functionality works with single provider relationships.

**Independent Test**: Can be fully tested by having two different service providers create/link the same client (using the same email), then verifying the client sees timeslots from both providers. Delivers value as a multi-provider booking system.

**Acceptance Scenarios**:

1. **Given** a client is linked to Provider A, **When** Provider B adds the same client by email, **Then** the client is linked to both providers without account duplication
2. **Given** a client is linked to multiple providers, **When** they view available timeslots in the calendar, **Then** they see slots from all their linked providers
3. **Given** a client books a timeslot with Provider A, **When** Provider B views their client's booking history, **Then** they only see bookings relevant to their own timeslots
4. **Given** a client is linked to multiple providers, **When** they view their profile, **Then** they see a list of all service providers they are connected to

---

### User Story 4 - Service Provider Manages Client Relationships (Priority: P2)

A service provider can remove a client from their list if the relationship ends, while preserving the client's account and relationships with other providers.

**Why this priority**: Important for data hygiene and privacy, but not critical for initial functionality.

**Independent Test**: Can be fully tested by linking a client to a provider, then removing the relationship, and verifying the client can no longer see that provider's timeslots. Delivers value as a relationship management tool.

**Acceptance Scenarios**:

1. **Given** a service provider has a client in their list, **When** they remove the client relationship, **Then** the client no longer appears in their client list
2. **Given** a provider removes a client relationship, **When** the client logs in, **Then** they can no longer see or book that provider's timeslots
3. **Given** a client is linked to multiple providers and one removes the relationship, **When** the client logs in, **Then** they still see timeslots from their remaining providers
4. **Given** a provider removes a client with future bookings, **When** they attempt the removal, **Then** the system requires confirmation and cancels all future bookings with that provider

---

### Edge Cases

- What happens when a client is created with an email that matches an existing admin or service provider account? System should prevent role conflicts or require explicit role change
- How does the system handle a client with no provider relationships? Client can still log in but sees no available timeslots until linked to at least one provider
- What happens when a service provider tries to manually assign a timeslot to a client who isn't in their client list? System should either auto-create the relationship or show an error requiring the provider to add the client first
- How does the calendar view change for clients with multiple providers? Calendar shows timeslots from all linked providers, optionally with filtering by provider
- What happens when a provider deletes their account with linked clients? Clients remain in the system but lose that provider relationship

## Requirements *(mandatory)*

### Functional Requirements

**Client-Provider Relationship Management:**
- **FR-001**: Service providers MUST be able to create new client accounts with name, email, and optional phone number
- **FR-002**: System MUST automatically establish a provider-client relationship when a provider creates a client account
- **FR-003**: System MUST allow a client to be linked to multiple service providers simultaneously
- **FR-004**: System MUST prevent duplicate client accounts when multiple providers add the same email address
- **FR-005**: Service providers MUST be able to view a list of all clients linked to them

**Client Account Management:**
- **FR-006**: System MUST send email notifications to newly created clients with account credentials and password reset instructions
- **FR-007**: Clients MUST be able to view which service providers they are linked to
- **FR-008**: Service providers MUST be able to remove a client from their list without deleting the client account
- **FR-009**: System MUST maintain data integrity when removing provider-client relationships (preserve client account and relationships with other providers)

**Integration with Existing Features:**
- **FR-010**: Calendar view MUST display timeslots only from service providers linked to the authenticated client
- **FR-011**: Manual timeslot assignment feature MUST only allow providers to assign clients from their own client list
- **FR-012**: Provider schedule view MUST show bookings from all their linked clients
- **FR-013**: Client booking history MUST show appointments across all their linked providers

**Data Integrity:**
- **FR-014**: System MUST prevent deletion of service provider accounts that have active client relationships
- **FR-015**: System MUST handle cascade operations when removing provider-client relationships (cancel future bookings, update timeslot availability)
- **FR-016**: System MUST log all client creation and relationship changes with timestamps and user identity

### Key Entities

- **User**: Existing entity extended to support client-provider relationships. Already has name, email, password (hashed), and role (Admin/ServiceProvider/Client)

- **ProviderClient**: New pivot/join entity representing the many-to-many relationship between service providers and clients. Contains:
  - provider_id (foreign key to users table where role='service_provider')
  - client_id (foreign key to users table where role='client')
  - created_at (timestamp when relationship established)
  - created_by_provider (boolean flag indicating if provider created the client account)
  - status (active/inactive for soft relationship management)
  - Unique constraint on (provider_id, client_id) to prevent duplicate relationships

- **Timeslot**: Existing entity - no changes needed, already has provider_id

- **Booking**: Existing entity - no changes needed, already links client and timeslot

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Service providers can create a new client account and establish the relationship in under 30 seconds
- **SC-002**: Clients can view timeslots from all their linked providers in a unified calendar without needing to switch contexts
- **SC-003**: System correctly prevents duplicate client accounts 100% of the time when multiple providers add the same email
- **SC-004**: Providers can find and select clients from their list in under 10 seconds when manually assigning timeslots
- **SC-005**: Relationship removal operations complete instantly and correctly update all related data (timeslots, bookings, calendar views)
- **SC-006**: Client creation workflow is intuitive enough that 95% of providers successfully add their first client without documentation

### Business Value

- **SC-007**: Enable service providers to build and manage their own client base within the system
- **SC-008**: Support multi-provider scenarios where clients work with several service providers
- **SC-009**: Reduce manual coordination by automatically linking clients to providers upon account creation
- **SC-010**: Improve data quality by preventing duplicate client accounts across providers

## Assumptions

1. **Provider Ownership**: When a service provider creates a client account, they "own" that relationship but don't have exclusive access to the client
2. **Email as Unique Identifier**: Email addresses uniquely identify clients across the system for relationship linking
3. **Automatic Linking**: No approval workflow needed - when a provider creates a client, the relationship is immediately active
4. **Password Management**: Newly created clients receive a system-generated temporary password via email and must reset it on first login
5. **No Self-Service Client Registration**: Clients cannot create their own accounts; they must be created by a service provider or admin
6. **Bi-directional Visibility**: Both providers and clients can see their relationship connections
7. **Soft Relationship Removal**: Removing a provider-client relationship doesn't delete the client account, only severs that specific connection

## Out of Scope

- Client approval/invitation workflow (provider sends invite, client accepts)
- Client ability to request connection to a provider
- Provider-client messaging or communication features
- Detailed client profile management (notes, preferences, history beyond bookings)
- Billing or payment information associated with provider-client relationships
- Client groups or client categorization features
- Import/export of client lists
- Client referral tracking
- Provider-to-provider client transfer functionality
