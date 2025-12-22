# Implementation Plan: Remove "Cancelled" Status from Timeslots

## Overview
Remove the "cancelled" status from the Timeslot model across the entire application. When a booking is cancelled, the timeslot will transition directly to "available" status instead.

## Current State Analysis

### Timeslot Status Values
- **Current**: `available`, `booked`, `cancelled`, `completed`
- **Target**: `available`, `booked`, `completed`

### Behavior Change
- **Before**: Cancel booking → status = 'cancelled'
- **After**: Cancel booking → status = 'available'

---

## Implementation Steps

### Phase 1: Backend - Model & Database

#### 1.1 Update Timeslot Model
**File**: `app/Models/Timeslot.php`

**Changes**:
- Remove `'is_cancelled'` from `$appends` array (line 45)
- Remove `scopeCancelled()` method (lines 85-88)
- Remove `getIsCancelledAttribute()` method (lines 169-172)
- Update `cancel()` method - already sets status to 'available' (line 196) ✓ No change needed

#### 1.2 Update Timeslot Factory
**File**: `database/factories/TimeslotFactory.php`

**Changes**:
- Remove `cancelled()` factory state method (lines 51-56)

#### 1.3 Update Database Migration
**File**: `database/migrations/2025_11_26_100948_consolidate_booking_into_timeslot.php`

**Changes**:
- Update ENUM in `up()` method (line 39):
  - From: `ENUM('available', 'booked', 'cancelled', 'completed')`
  - To: `ENUM('available', 'booked', 'completed')`
- Update ENUM in `down()` method (line 56):
  - From: `ENUM('available', 'booked', 'cancelled')`
  - To: `ENUM('available', 'booked')`

#### 1.4 Create Data Migration
**New File**: `database/migrations/YYYY_MM_DD_HHMMSS_migrate_cancelled_timeslots_to_available.php`

**Purpose**: Convert all existing cancelled timeslots to available status

```php
public function up(): void
{
    DB::table('timeslots')
        ->where('status', 'cancelled')
        ->update(['status' => 'available']);
}
```

---

### Phase 2: Backend - Controllers

#### 2.1 TimeslotController
**File**: `app/Http/Controllers/TimeslotController.php`

**Changes**:
- Remove 'cancelled' case from status filter (lines 56-57)
- Remove from $allowedStatuses validation if present

#### 2.2 Provider\ClientController
**File**: `app/Http/Controllers/Provider/ClientController.php`

**Changes**:
- Line 197: Update from `'status' => 'cancelled'` to `'status' => 'available'`
- Review cancelAllBookings() method for consistency

---

### Phase 3: Frontend - React/TypeScript

#### 3.1 TypeScript Types
**File**: `resources/js/types/timeslot.ts`

**Changes**:
- Remove `is_cancelled: boolean;` (line 11)
- Update status type from: `status: 'available' | 'booked' | 'cancelled' | 'completed'`
- To: `status: 'available' | 'booked' | 'completed'`

#### 3.2 Status Badge Component
**File**: `resources/js/components/StatusBadge.tsx`

**Changes**:
- Remove 'cancelled' status type from props (line 4)
- Remove 'cancelled' badge configuration (lines 26-30)

#### 3.3 Timeslots Index Page
**File**: `resources/js/pages/Timeslots/Index.tsx`

**Changes**:
- Update filters interface to remove 'cancelled' (line 44)
- Remove 'Cancelled' tab from TabsList (~line 210)
- Remove delete button for cancelled timeslots (lines 492-511)

#### 3.4 Provider Clients Index
**File**: `resources/js/pages/Provider/Clients/Index.tsx`

**Changes**:
- Review for any references to cancelled status
- Update any filtering or display logic

---

### Phase 4: Tests

#### 4.1 TimeslotPolicyTest
**File**: `tests/Feature/TimeslotPolicyTest.php`

**Changes**:
- Remove `provider_can_delete_own_cancelled_timeslot` test (lines 206-215)
- Remove `provider_can_delete_own_past_cancelled_timeslot` test (lines 217-227)
- Update test count from 20 to 18 tests

#### 4.2 Seeder
**File**: `database/seeders/TimeslotBookingSeeder.php`

**Changes**:
- Line 56: Remove cancelled status generation
- Update to only generate 'booked' or 'available' statuses

---

### Phase 5: Documentation

#### 5.1 CLAUDE.md
**File**: `CLAUDE.md`

**Changes**:
- Remove `is_cancelled` from computed attributes (line 159)
- Remove `cancelled()` scope description (line 165)
- Remove `cancel()` method description (line 175) or update to reflect new behavior
- Update all status enum references throughout

#### 5.2 Laravel Expert Agent
**File**: `.github/agents/laravel-expert.agent.md`

**Changes**:
- Line 62: Remove `cancelled()` from scope list
- Line 69: Remove `is_cancelled` from computed attributes

#### 5.3 Specification Files
**Files**:
- `specs/001-timeslot-booking/*`
- `specs/003-consolidate-booking-to-timeslot/IMPLEMENTATION.md`

**Changes**:
- Update all references to removed 'cancelled' status
- Update data models, contracts, and task lists

---

## Migration Strategy

### Option A: Immediate Migration (Recommended)
1. Create data migration to convert existing cancelled → available
2. Run migration before deploying code changes
3. Deploy all code changes at once
4. Minimal downtime, clean cutover

### Option B: Gradual Migration
1. Deploy code that handles both statuses
2. Run data migration in background
3. Deploy final cleanup after migration complete
4. More complex but zero downtime

**Recommendation**: Option A - simpler, cleaner, acceptable downtime

---

## Rollback Plan

If issues arise:
1. Revert code deployment
2. Run reverse migration:
   ```php
   // Restore ENUM with cancelled
   // Convert any problematic available back to cancelled (manual review needed)
   ```

---

## Testing Checklist

### Unit Tests
- [ ] TimeslotPolicyTest passes (18 tests)
- [ ] Timeslot model tests pass
- [ ] Factory tests pass

### Integration Tests
- [ ] Booking cancellation creates available timeslots
- [ ] UI correctly displays only 3 statuses
- [ ] Filtering works without cancelled option
- [ ] No orphaned cancelled timeslots in database

### Manual Testing
- [ ] Service provider can cancel booking → timeslot becomes available
- [ ] Client can cancel booking → timeslot becomes available
- [ ] Status badge shows only 3 status types
- [ ] Timeslots page filters work correctly
- [ ] No UI references to "cancelled" status
- [ ] Database constraint accepts only 3 statuses

---

## Estimated Impact

### Files to Modify: **~20 files**
### Tests to Update: **2 tests to remove**
### Database Tables: **1 (timeslots)**
### Risk Level: **Medium**
- Core functionality change
- Affects multiple user flows
- Requires data migration

### Estimated Time: **3-4 hours**
- Implementation: 2 hours
- Testing: 1 hour
- Documentation: 30 minutes
- Deployment + monitoring: 30 minutes

---

## Dependencies & Constraints

### Breaking Changes
- API responses will no longer include `is_cancelled` attribute
- Frontend expecting 'cancelled' status will need updates
- Existing cancelled timeslots will become available

### No Breaking Changes For
- Core booking/cancellation functionality (still works)
- User workflows (cancellation still sets status to available)
- Data integrity (no data loss)

---

## Deployment Order

1. **Database Migration** (data conversion)
2. **Backend Changes** (models, controllers, migrations)
3. **Frontend Build** (React/TypeScript)
4. **Cache Clear** (clear all caches)
5. **Test Suite** (run full test suite)
6. **Monitor** (check logs for errors)

---

## Success Criteria

- ✓ All tests pass
- ✓ No 'cancelled' status in database
- ✓ Booking cancellation workflow functional
- ✓ UI shows only 3 status badges
- ✓ No console errors in browser
- ✓ No PHP errors in logs
- ✓ Database ENUM constraint enforced

---

## Notes

### Why Remove Cancelled Status?

The 'cancelled' status is functionally equivalent to 'available' - both represent timeslots that can be booked. Having both statuses adds unnecessary complexity:

1. **Simplified State Machine**: 3 states instead of 4
2. **Clearer Semantics**: Either a timeslot is bookable (available) or not (booked/completed)
3. **Less Code**: Fewer conditions to check, fewer UI states
4. **Better UX**: Clients don't need to distinguish between available and cancelled

### Alternative Approach

If historical tracking is needed:
- Keep audit log of cancellations
- Add `cancelled_at` timestamp (nullable)
- Status remains 'available' but track cancellation history
- This wasn't implemented in current plan but could be added

