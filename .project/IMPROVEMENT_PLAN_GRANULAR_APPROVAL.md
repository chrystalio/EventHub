# Improvement Plan: Granular Approval/Reject for Event Attendees

## Problem Statement

**Current Limitation:**
When a private event allows registrants to bring guests, the approval/reject process operates at the registration level only. This means:
- Akademik/Panitia can approve or reject the entire registration
- Cannot approve/reject individual guests
- If one guest needs to be rejected, the entire registration (registrant + all guests) must be rejected

**Impact:**
- Forces rejection of valid registrants when only their guest(s) should be rejected
- Reduces flexibility in managing event attendance
- Creates poor user experience for legitimate registrants

## Proposed Solution

Enable granular approval/reject at the **attendee level** (RegistrationAttendee) instead of only at the registration level.

## Current Architecture

### Models & Relationships
- `Event` → has many → `Registration`
- `Registration` → belongs to → `User` (registrant)
- `Registration` → has many → `RegistrationAttendee` (registrant + guests)
- `RegistrationAttendee` → has fields: `status`, `approved_at`, `approved_by_uuid`, `rejected_at`, `rejected_by_uuid`

### Current Status Field Values
- `pending` - Awaiting approval
- `approved` - Approved
- `rejected` - Rejected
- `cancelled` - Cancelled by registrant

## Implementation Plan

### Phase 1: Database & Model Updates

#### 1.1 Review Current Schema
- [ ] Verify `registration_attendees` table has necessary fields:
  - `status` enum
  - `approved_at` timestamp
  - `approved_by_uuid` foreign key
  - `rejected_at` timestamp
  - `rejected_by_uuid` foreign key
  - `rejection_reason` text field (add if missing)

#### 1.2 Add Migration (if needed)
```php
// If rejection_reason doesn't exist
Schema::table('registration_attendees', function (Blueprint $table) {
    $table->text('rejection_reason')->nullable()->after('rejected_by_uuid');
});
```

#### 1.3 Update Models
- [ ] Ensure `RegistrationAttendee` model has proper relationships:
  - `approvedBy()` relationship to User
  - `rejectedBy()` relationship to User
- [ ] Add scope methods: `scopePending()`, `scopeApproved()`, `scopeRejected()`

### Phase 2: Backend Logic

#### 2.1 Create/Update Services
- [ ] Create `RegistrationAttendeeService` or update existing service
  - `approveAttendee(RegistrationAttendee $attendee, User $approver)`
  - `rejectAttendee(RegistrationAttendee $attendee, User $rejecter, string $reason)`
  - `bulkApproveAttendees(array $attendeeIds, User $approver)`
  - `bulkRejectAttendees(array $attendeeIds, User $rejecter, string $reason)`

#### 2.2 Update Registration Service
- [ ] Update registration approval logic to handle attendee-level status
- [ ] Add method to check if all attendees in registration are approved
- [ ] Update overall registration status based on attendee statuses:
  - All attendees approved → registration approved
  - All attendees rejected → registration rejected
  - Mixed → registration status = 'partial' or keep as 'pending'

#### 2.3 Create Controllers/Routes
- [ ] Add routes in `routes/web.php`:
  ```php
  // Akademik/Panitia routes
  Route::middleware(['auth', 'can:registration.manage'])->group(function () {
      Route::post('/events/{event:uuid}/attendees/{attendee:uuid}/approve', [AttendeeApprovalController::class, 'approve']);
      Route::post('/events/{event:uuid}/attendees/{attendee:uuid}/reject', [AttendeeApprovalController::class, 'reject']);
      Route::post('/events/{event:uuid}/attendees/bulk-approve', [AttendeeApprovalController::class, 'bulkApprove']);
      Route::post('/events/{event:uuid}/attendees/bulk-reject', [AttendeeApprovalController::class, 'bulkReject']);
  });
  ```

- [ ] Create `AttendeeApprovalController`:
  - Validate permissions (only Akademik/Panitia can approve/reject)
  - Call service methods
  - Return appropriate responses
  - Handle errors gracefully

#### 2.4 Update Form Requests
- [ ] Create `ApproveAttendeeRequest`
- [ ] Create `RejectAttendeeRequest` with `rejection_reason` validation

### Phase 3: Frontend Updates

#### 3.1 Update Event Registration Review Page
Location: `resources/js/pages/authenticated/events/registrations.tsx` (or similar)

Changes needed:
- [ ] Display individual attendees in a table/list format
- [ ] Show attendee details: name, email, phone, status
- [ ] Add action buttons per attendee:
  - "Approve" button (for pending/rejected attendees)
  - "Reject" button (for pending/approved attendees) with reason modal
  - Visual status indicators
- [ ] Add bulk selection:
  - Checkboxes for each attendee
  - "Approve Selected" button
  - "Reject Selected" button
- [ ] Show rejection reason if attendee is rejected
- [ ] Add filters: All / Pending / Approved / Rejected

#### 3.2 Create Components
- [ ] `AttendeeListItem` - Individual attendee row with actions
- [ ] `AttendeeApprovalActions` - Approve/Reject buttons
- [ ] `RejectAttendeeDialog` - Modal for rejection with reason input
- [ ] `BulkApprovalActions` - Bulk approve/reject controls
- [ ] `AttendeeStatusBadge` - Visual status indicator

#### 3.3 Update TypeScript Types
```typescript
// resources/js/types/index.d.ts
export interface RegistrationAttendee {
  uuid: string;
  registration_uuid: string;
  name: string;
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_at?: string;
  approved_by?: User;
  rejected_at?: string;
  rejected_by?: User;
  rejection_reason?: string;
  is_primary: boolean; // Is the registrant (not a guest)
  attended_at?: string;
  created_at: string;
}
```

#### 3.4 API Integration
- [ ] Create API client functions in `resources/js/lib/api.ts`:
  - `approveAttendee(eventUuid, attendeeUuid)`
  - `rejectAttendee(eventUuid, attendeeUuid, reason)`
  - `bulkApproveAttendees(eventUuid, attendeeUuids)`
  - `bulkRejectAttendees(eventUuid, attendeeUuids, reason)`
- [ ] Add loading states
- [ ] Add optimistic updates
- [ ] Handle errors with toast notifications

### Phase 4: Policies & Permissions

#### 4.1 Update Policies
- [ ] Create or update `RegistrationAttendeePolicy`:
  - `approve()` - Check if user is Akademik or Panitia for the event
  - `reject()` - Same as approve
  - Ensure System Administrator always has access
- [ ] Update `EventPolicy` if needed

#### 4.2 Permission Checks
- [ ] Add middleware to routes
- [ ] Add policy checks in controller methods
- [ ] Add frontend permission checks (hide/disable buttons based on user role)

### Phase 5: Notifications

#### 5.1 Email Notifications
- [ ] Update or create notification for attendee approval
  - Notify registrant when their attendee is approved
  - Include which specific attendee was approved
- [ ] Create notification for attendee rejection
  - Notify registrant when attendee is rejected
  - Include rejection reason
  - If they are primary registrant, explain what this means
- [ ] Update templates in `resources/views/emails/`

#### 5.2 In-App Notifications (Optional)
- [ ] Add notification table entries
- [ ] Display in notification dropdown

### Phase 6: Testing

#### 6.1 Backend Tests
- [ ] Test attendee approval flow
- [ ] Test attendee rejection with reason
- [ ] Test bulk approval
- [ ] Test bulk rejection
- [ ] Test permissions (only Akademik/Panitia can approve/reject)
- [ ] Test edge cases:
  - Approving already approved attendee
  - Rejecting primary registrant vs guest
  - All attendees rejected → registration status
  - Mixed approval status

#### 6.2 Frontend Tests (Optional)
- [ ] Test UI interactions
- [ ] Test bulk selection
- [ ] Test rejection modal
- [ ] Test API error handling

#### 6.3 Manual Testing
- [ ] Create test event (private, allows guests)
- [ ] Register with guests
- [ ] Test approval of individual guest
- [ ] Test rejection of individual guest
- [ ] Test bulk operations
- [ ] Verify email notifications
- [ ] Test as different roles (Akademik, Panitia, Admin)

### Phase 7: Documentation

#### 7.1 Update User Documentation
- [ ] Add section explaining granular approval process
- [ ] Add screenshots/guide for Akademik/Panitia

#### 7.2 Update CLAUDE.md
- [ ] Document new attendee-level approval flow
- [ ] Update architecture section
- [ ] Add notes about permissions

## UI/UX Considerations

### Registration Review Page Layout
```
Event: [Event Name]
Tab: Registrations | Attendees (if showing attendees separately)

Filters: [All] [Pending] [Approved] [Rejected]
Bulk Actions: [Select All] [Approve Selected] [Reject Selected]

┌─────────────────────────────────────────────────────────────┐
│ Registration #1 - John Doe (johndoe@email.com)              │
├─────────────────────────────────────────────────────────────┤
│ □ John Doe (Registrant)         | Status: Approved          │
│   johndoe@email.com | +1234567890                           │
│   Approved by: Admin Name on Jan 1, 2025                    │
│                                                              │
│ □ Jane Smith (Guest)            | Status: Pending           │
│   janesmith@email.com | +1234567891                         │
│   [Approve] [Reject]                                        │
│                                                              │
│ □ Bob Johnson (Guest)           | Status: Rejected          │
│   bobjohnson@email.com | +1234567892                        │
│   Rejected by: Admin Name on Jan 1, 2025                    │
│   Reason: Does not meet event requirements                  │
│   [Approve]                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Rejection Dialog
```
┌─────────────────────────────────────────┐
│ Reject Attendee                         │
├─────────────────────────────────────────┤
│ Are you sure you want to reject this    │
│ attendee?                               │
│                                         │
│ Name: Jane Smith                        │
│ Email: janesmith@email.com              │
│                                         │
│ Rejection Reason (required):            │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Note: The registrant will be notified. │
│                                         │
│          [Cancel] [Reject Attendee]     │
└─────────────────────────────────────────┘
```

## Migration Strategy

### Backward Compatibility
- Existing registrations continue to work
- Old approval flow (registration-level) can coexist
- Attendee-level approval is opt-in based on UI interaction

### Data Migration (if needed)
If there are existing approved/rejected registrations:
```php
// Set all attendees in approved registrations to approved
Registration::where('status', 'approved')->each(function ($registration) {
    $registration->attendees()->update([
        'status' => 'approved',
        'approved_at' => $registration->approved_at,
        'approved_by_uuid' => $registration->approved_by_uuid,
    ]);
});

// Similar for rejected registrations
```

## Rollout Plan

1. **Development** - Implement all phases
2. **Internal Testing** - Test with staging data
3. **User Acceptance Testing** - Get feedback from Akademik/Panitia users
4. **Soft Launch** - Enable for new events only
5. **Full Launch** - Enable for all events
6. **Monitor** - Track usage and gather feedback

## Success Metrics

- [ ] Akademik/Panitia can approve/reject individual attendees
- [ ] No more unnecessary rejection of valid registrants
- [ ] Email notifications sent correctly
- [ ] Performance is acceptable (page load < 2s)
- [ ] No critical bugs reported in first week
- [ ] Positive user feedback from Akademik/Panitia

## Open Questions

1. Should primary registrant (not guest) be rejectable individually, or should rejecting them auto-reject all guests?
2. What happens to approved guests if the primary registrant is later rejected?
3. Should there be a "partial approval" status for registrations with mixed attendee statuses?
4. Do we need an audit log for approval/rejection actions?
5. Should bulk operations have a confirmation dialog?

## Estimated Effort

- **Phase 1 (Database)**: 2-4 hours
- **Phase 2 (Backend)**: 8-12 hours
- **Phase 3 (Frontend)**: 12-16 hours
- **Phase 4 (Permissions)**: 2-4 hours
- **Phase 5 (Notifications)**: 4-6 hours
- **Phase 6 (Testing)**: 6-8 hours
- **Phase 7 (Documentation)**: 2-3 hours

**Total Estimated Effort**: 36-53 hours (roughly 5-7 working days)

## Next Steps

1. Review this plan and gather feedback
2. Address open questions
3. Start with Phase 1 (Database review and updates)
4. Implement incrementally, testing each phase
5. Deploy to staging environment for UAT
6. Launch to production

---

**Last Updated**: 2025-11-09
**Status**: Planning