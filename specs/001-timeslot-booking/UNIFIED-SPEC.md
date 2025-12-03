# Unified Feature Specification: Timeslot Booking, Client-Provider Relationship, Booking Consolidation, and Modal Timeslot Creation

**Feature Branches**: `001-timeslot-booking`, `002-client-provider-link`, `003-consolidate-booking-to-timeslot`, `004-modal-based-timeslot-creation`
**Created**: 2025-11-22
**Status**: Draft

---

## Overview
This document merges the requirements and user stories from all four specs:
- Timeslot booking and management
- Client-provider relationship management
- Booking consolidation
- Modal-based timeslot creation

---

## User Stories & Scenarios

### P1: Core Booking & Relationship
- **US1:** Client books available timeslot
- **US2:** Service provider creates available timeslots
- **US3:** Service provider creates client account (auto-link)
- **US4:** Service provider views their client list

### P2: Management & Flexibility
- **US5:** Client belongs to multiple providers
- **US6:** Service provider manages bookings (add/remove/cancel)
- **US7:** Client cancels/declines booking
- **US8:** Service provider manages client relationships (remove link)

### P3: Admin & Advanced
- **US9:** Admin manages users
- **US10:** Admin acts on behalf of provider

*All acceptance scenarios from the original specs are preserved and merged under each story in the full document.*

---

## Functional Requirements
- All requirements from all four specs are included and harmonized.
- Role-based access (Admin, ServiceProvider, Client)
- Timeslot CRUD, booking, and status management
- Provider-client many-to-many relationship (with pivot entity)
- Email notifications for account creation and booking events
- Data integrity for bookings and relationships
- Modal-based UI for timeslot creation and management

---

## Key Entities
- **User** (with roles)
- **ProviderClient** (pivot: provider_id, client_id, status, etc.)
- **Timeslot**
- **Booking**

---

## Edge Cases
- Double-booking race conditions
- Duplicate client account prevention
- Relationship removal with future bookings
- Multi-provider calendar display
- Modal-based creation/cancellation flows

---

## Out of Scope
- Payment processing
- Self-service registration
- Messaging, billing, or group bookings
- Calendar integrations

---

## Calendar & UI Features
- Unified calendar route for all roles
- Modal/dialog-based timeslot creation and management
- Persistent view state
- Visual status indicators

---

## Success Criteria & Business Value
- All measurable outcomes and business value points from the original specs are merged and listed.

---

## Versioning & Traceability
- This document supersedes `/specs/001`, `/specs/002`, `/specs/003`, and `/specs/004`.
- For detailed acceptance criteria, requirements, and scenarios, see the full merged content below (to be expanded as needed).
