# Viewport & Staggered Mode Improvements

## Overview

This document describes the improvements made to viewport management and staggered ticket mode behavior.

## Changes Implemented

### 1. **Viewport Height Constraints (100vh)**

#### Problem
Previously, the UI could extend beyond the viewport height, causing the entire page to scroll. This meant users had to scroll the whole page to see content.

#### Solution
Implemented a strict 100vh (100% viewport height) constraint with internal scrolling only.

#### Implementation

**Main Experiment Page** (`app/experiment/page.tsx`):
```tsx
// Before: min-h-screen (could exceed viewport)
<div className="min-h-screen bg-gray-100">

// After: h-screen with flex column (strict viewport height)
<div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
  {/* Fixed Process Bar */}
  <div className="flex-shrink-0">
    <ProcessBar ... />
  </div>

  {/* Scrollable Content Area */}
  <div className="flex-1 overflow-y-auto">
    ...
  </div>
</div>
```

**Benefits**:
- ✅ No page-level scrolling
- ✅ Process bar always visible (fixed at top)
- ✅ Only component content scrolls
- ✅ Better viewport utilization
- ✅ Consistent experience across all screen sizes

#### Components Updated

All main components now use the pattern: `h-full flex flex-col overflow-hidden`

1. **TicketOverview.tsx**:
   ```tsx
   <div className="h-full flex flex-col overflow-hidden">
     <div className="flex-shrink-0">Header</div>
     <div className="flex-1 overflow-y-auto">Scrollable ticket list</div>
   </div>
   ```

2. **TicketDetail.tsx**:
   ```tsx
   <div className="h-full overflow-y-auto flex flex-col">
     <div className="sticky top-0">Header</div>
     <div className="flex-1 overflow-y-auto">Scrollable form</div>
   </div>
   ```

3. **KnowledgeBase.tsx**:
   ```tsx
   <div className="h-full flex flex-col">
     <div className="flex-shrink-0">Header + Search</div>
     <div className="flex-1 overflow-hidden">Tree or Article</div>
   </div>
   ```

4. **ChatAssistant.tsx**:
   - Already had correct structure
   - Messages scroll, input stays at bottom

5. **AIAgentConfirm.tsx** & **AIAgentAuto.tsx**:
   ```tsx
   <div className="h-full flex flex-col overflow-hidden">
     <div className="flex-shrink-0">Header</div>
     <div className="flex-1 overflow-y-auto">Content</div>
   </div>
   ```

---

### 2. **Staggered Mode - Faster Ticket Appearance**

#### Problem
Tickets appeared too slowly (every 90 seconds), making the staggered mode tedious.

#### Solution
Reduced ticket appearance intervals from 90 to 60 seconds.

#### Changes (`data/tickets.json`):

**Before**:
```json
T001: 0 seconds
T002: 90 seconds
T003: 180 seconds
T004: 270 seconds
...
T010: 810 seconds (13.5 minutes)
```

**After**:
```json
T001: 45 seconds   (was 0)
T002: 120 seconds  (was 90)
T003: 180 seconds  (same)
T004: 240 seconds  (was 270)
T005: 300 seconds  (was 360)
T006: 360 seconds  (was 450)
T007: 420 seconds  (was 540)
T008: 480 seconds  (was 630)
T009: 540 seconds  (was 720)
T010: 600 seconds  (was 810)
```

**Benefits**:
- ✅ Tickets appear every 60 seconds on average
- ✅ All tickets appear within 10 minutes (vs 13.5 minutes before)
- ✅ More engaging pacing
- ✅ Maintains time pressure

---

### 3. **Hide Locked Tickets**

#### Problem
Locked tickets (not yet available) were shown in the overview with "Locked" badges and lock icons, cluttering the interface.

#### Solution
Filter out locked tickets from display entirely - they only appear when unlocked.

#### Implementation (`components/experiment/TicketOverview.tsx`):

```tsx
export default function TicketOverview({ tickets, onSelectTicket }: TicketOverviewProps) {
  // Filter out locked tickets - only show available, in-progress, and completed
  const visibleTickets = tickets.filter(ticket => ticket.status !== 'locked');

  return (
    <div>
      {visibleTickets.length > 0 ? (
        visibleTickets.map((ticket) => ...)
      ) : (
        // Empty state when no tickets available yet
        <div className="text-center py-12">
          <h3>No Tickets Available Yet</h3>
          <p>New tickets will appear shortly. Please wait...</p>
        </div>
      )}
    </div>
  );
}
```

**Benefits**:
- ✅ Cleaner interface - only shows actionable tickets
- ✅ Reduces visual clutter
- ✅ Creates anticipation as tickets appear
- ✅ Helpful empty state with loading message
- ✅ Staggered mode feels more dynamic

**Empty State**:
- Shows when no tickets are available yet (staggered mode start)
- Clock icon with message: "No Tickets Available Yet"
- Subtitle: "New tickets will appear shortly. Please wait..."

---

### 4. **Prevent Early Experiment Completion**

#### Problem
In staggered mode, if participants completed all visible tickets, the experiment would end even though more tickets were still locked and would appear later.

#### Solution
Check for locked tickets before finishing - only end when ALL tickets (including locked) are completed.

#### Implementation (`app/experiment/page.tsx`):

```tsx
const handleCompleteTicket = (response: TicketResponse) => {
  // Save response and update status
  storage.addTicketResponse(response);
  setTickets((prevTickets) =>
    ticketService.updateTicketStatus(prevTickets, response.ticketId, 'completed')
  );
  setCurrentTicketId(null);

  // Check if there are still locked tickets pending
  const hasLockedTickets = tickets.some((t) => t.status === 'locked');
  const allAvailableCompleted = tickets.every(
    (t) => t.id === response.ticketId || t.status === 'completed' || t.status === 'locked'
  );

  // Only finish if all available tickets are done AND no locked tickets remain
  if (allAvailableCompleted && !hasLockedTickets) {
    // All tickets completed - go to survey
    setTimeout(() => {
      router.push('/survey');
    }, 1000);
  }
};
```

**Logic**:
1. When a ticket is completed, check if there are locked tickets
2. If locked tickets exist, don't finish the experiment
3. Only navigate to survey when:
   - All visible tickets are completed, AND
   - No locked tickets remain

**Benefits**:
- ✅ Participants can complete all tickets in staggered mode
- ✅ No premature experiment ending
- ✅ Proper completion tracking
- ✅ Accurate performance metrics

---

### 5. **Process Bar Updates**

#### Implementation
The ProcessBar now correctly shows progress including locked tickets:

```tsx
const completedCount = tickets.filter(t => t.status === 'completed').length;
const totalTickets = tickets.length; // Includes locked tickets
```

**Display**:
- Progress: "3 / 10 Tickets" (even if 7 are locked)
- Progress bar: Shows completion percentage of total
- Users see the full scope of work

**Benefits**:
- ✅ Participants know total ticket count
- ✅ Progress reflects actual work done
- ✅ Maintains consistency across timing modes

---

## User Experience Flow

### Staggered Mode Experience

**Start (0 seconds)**:
- Empty state shown: "No Tickets Available Yet"
- Process bar: "0 / 10 Tickets"
- Message: "New tickets will appear shortly"

**After 45 seconds**:
- First ticket (T001) appears
- Participant can start working
- Process bar: "0 / 10 Tickets"

**After 60 seconds (2:00)**:
- Second ticket (T002) appears while working
- Now have 2 tickets available
- Can switch between them

**Throughout Experiment**:
- New tickets appear every ~60 seconds
- Completed tickets stay visible (with checkmark)
- Only locked tickets are hidden
- Clear visual feedback when new tickets arrive

**Completion**:
- Last ticket appears at 10 minutes
- Can use remaining 5 minutes to complete
- Experiment only ends when:
  - Time expires (15 minutes), OR
  - All 10 tickets completed

---

## Technical Details

### CSS Structure

**Flexbox Layout**:
```css
.container {
  height: 100vh;           /* Full viewport */
  display: flex;
  flex-direction: column;
  overflow: hidden;        /* Prevent page scroll */
}

.header {
  flex-shrink: 0;          /* Fixed height */
}

.content {
  flex: 1;                 /* Fill remaining space */
  overflow-y: auto;        /* Scroll internally */
}
```

**Scrolling Behavior**:
- Page-level: No scrolling
- Component-level: Smooth internal scrolling
- Sticky elements: Process bar stays fixed

### Ticket Status Flow

```
locked → available → in-progress → completed
   ↓                      ↓              ↓
Hidden    Visible in   Currently    Visible with
          list         editing      checkmark
```

---

## Testing Checklist

### Viewport Constraints
- [x] No page scrolling on any screen size
- [x] Process bar always visible
- [x] Component content scrolls internally
- [x] Works on desktop, tablet, mobile
- [x] All components constrained to viewport

### Staggered Mode
- [x] Tickets appear every 60 seconds
- [x] Empty state shows at start
- [x] Locked tickets are hidden
- [x] New tickets appear with animation
- [x] Can complete all tickets before time expires

### Completion Logic
- [x] Doesn't finish with locked tickets pending
- [x] Finishes when all tickets completed
- [x] Finishes when time expires
- [x] Process bar shows accurate progress
- [x] Manual "End Early" button works

---

## Files Modified

1. ✅ `app/experiment/page.tsx` - Viewport constraints, completion logic
2. ✅ `components/experiment/TicketOverview.tsx` - Hide locked tickets, empty state
3. ✅ `components/experiment/TicketDetail.tsx` - Height constraints
4. ✅ `components/experiment/KnowledgeBase.tsx` - Height constraints
5. ✅ `components/experiment/AIAgentConfirm.tsx` - Height constraints
6. ✅ `components/experiment/AIAgentAuto.tsx` - Height constraints
7. ✅ `components/experiment/ProcessBar.tsx` - Progress calculation comment
8. ✅ `data/tickets.json` - Updated scheduledAppearance times

**Note**: ChatAssistant.tsx already had correct structure.

---

## Summary

### What Changed
- ✅ **Viewport**: Strict 100vh height, internal scrolling only
- ✅ **Stagger Speed**: Tickets every 60s (was 90s)
- ✅ **Ticket Visibility**: Locked tickets hidden (was visible)
- ✅ **Completion**: Only ends when no locked tickets remain
- ✅ **Empty State**: Helpful message when no tickets available

### Benefits for Participants
- Better screen space utilization
- Process bar always visible
- Cleaner interface (no clutter)
- Faster ticket pacing
- Can complete all tickets in time
- Clear visual feedback

### Benefits for Researchers
- Consistent viewport behavior
- Accurate completion tracking
- Better engagement in staggered mode
- All participants can finish tasks
- Cleaner behavioral data

---

## Build Status

✅ **Build Successful**
- No TypeScript errors
- All components compile
- Ready for deployment

```
Route (app)                              Size     First Load JS
├ ○ /experiment                          14.6 kB         160 kB
```

The platform is now ready for testing and deployment!
