# PostHog Tracking Configuration

This document describes the comprehensive event tracking system implemented for the TUD Experiment Platform.

## Overview

The platform uses **PostHog** for analytics and behavioral tracking. The tracking system captures:
- User interactions (clicks, mouse movements, form inputs)
- Experiment progress (tickets, decisions, responses)
- Performance metrics (timing, error rates, quality scores)
- Behavioral patterns (rage clicks, focus changes, navigation)
- System errors and exceptions

## Configuration

### Environment Variables

```bash
# PostHog API credentials
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Development mode control
NEXT_PUBLIC_POSTHOG_DISABLE_IN_DEV=false  # Set to 'true' to disable tracking in dev
```

### PostHog Features Enabled

The following automatic capture features are enabled:

1. **Autocapture**: Automatically tracks clicks, form submissions, and interactions
2. **Pageview Tracking**: Captures page views automatically
3. **Pageleave Tracking**: Tracks when users leave pages
4. **Dead Click Tracking**: Detects clicks that don't lead to actions (user frustration indicator)
5. **Rage Click Detection**: Tracks rapid repeated clicks (frustration indicator)
6. **Session Recording**: Records user sessions with screen replay
7. **Console Log Capture**: Captures console logs in session recordings
8. **Error Tracking**: Automatic capture of JavaScript errors and unhandled promise rejections

## Event Types

### Core Experiment Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `experiment_started` | Participant begins experiment | participantId, group, timingMode |
| `experiment_paused` | Experiment paused | reason, ticketId |
| `experiment_resumed` | Experiment resumed | pausedDurationMs, ticketId |
| `experiment_time_expired` | 15-minute timer expired | completedTickets, totalTickets |

### Ticket Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `ticket_opened` | Ticket detail view accessed | ticketId, timestamp |
| `ticket_closed` | Ticket completed | ticketId, timestamp, timeToComplete |
| `ticket_view_duration` | Time spent viewing ticket | ticketId, durationMs, completed |
| `ticket_list_filtered` | Ticket list filtered | filterType, filterValue |
| `ticket_list_sorted` | Ticket list sorted | sortBy, sortOrder |

### Decision Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `decision_made` | Decision selected (priority/category/assignment) | ticketId, decisionType, value, timeSinceLastDecision |
| `decision_changed` | Decision modified after initial selection | ticketId, decisionType, oldValue, newValue |
| `first_decision_timing` | Time to first decision on ticket | ticketId, timeToFirstDecision, decisionType |
| `dropdown_opened` | Dropdown menu opened | ticketId, dropdownType |
| `dropdown_closed` | Dropdown menu closed | ticketId, dropdownType, selectionMade |

### Customer Response Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `customer_response_sent` | Customer response submitted | ticketId, responseText, responseLength |
| `response_text_changed` | Response text edited | ticketId, textLength, changeType (typed/pasted/deleted) |

### AI Agent Events (Groups 3 & 4)

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `ai_agent_started` | AI agent begins processing | ticketId, agentType (confirm/auto) |
| `ai_agent_completed` | AI agent finishes processing | ticketId, agentType, totalSteps, timeToComplete |
| `ai_agent_step_viewed` | AI step displayed to user | ticketId, stepNumber, stepName, timeOnStep |
| `ai_step_accepted` | AI suggestion accepted | ticketId, stepNumber, stepName |
| `ai_step_rejected` | AI suggestion rejected | ticketId, stepNumber, stepName |
| `ai_step_edited` | AI suggestion modified | ticketId, stepNumber, stepName, newValue |

### Chat Events (Group 2)

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `chat_message_sent` | Chat message sent | messageLength, ticketId |
| `chat_response_copied` | AI response copied | responseLength, ticketId |
| `chat_response_inserted` | AI response inserted into ticket | responseLength, ticketId, insertionMethod |

### Knowledge Base Events (Group 1)

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `knowledge_base_opened` | Knowledge base node clicked | nodeId, nodeTitle |
| `knowledge_base_searched` | Knowledge base searched | query, resultsCount, queryLength |

### Survey Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `survey_completed` | Post-experiment survey submitted | All survey responses |
| `survey_question_answered` | Individual question answered | questionId, questionText, answer |

### Sidebar Interaction Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `sidebar_section_focused` | Sidebar section activated | section, ticketId |
| `sidebar_interaction_started` | User begins sidebar interaction | section |
| `sidebar_interaction_ended` | User ends sidebar interaction | section, durationMs |

### Mouse & Behavioral Events

| Event | Description | Data Captured | Sampling |
|-------|-------------|---------------|----------|
| `mouse_click` | Mouse click | x, y, elementType, elementId | 10% sample |
| `mouse_move` | Mouse movement | x, y, velocity | 1% sample |
| `rage_click_detected` | Rapid repeated clicks detected | x, y, clickCount | 100% |

### Page Navigation Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `page_viewed` | Page navigation | pageName, previousPage |
| `page_performance` | Page load performance | domContentLoaded, loadComplete, domInteractive |

### Focus & Attention Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `window_focus_changed` | Browser window focus changed | hasFocus, ticketId |
| `tab_visibility_changed` | Browser tab visibility changed | isVisible, ticketId |

### Timer Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `timer_warning` | Time warning displayed | remainingSeconds, warningType (5min/2min/1min) |

### Data Sync Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `data_synced` | Trace data synced to server | eventsCount, syncType (auto/manual/final) |
| `data_sync_failed` | Data sync failed | error, eventsCount |

### Form & Validation Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `form_validation_error` | Form validation error | formType, field, errorMessage, ticketId |

### Error Tracking Events

| Event | Description | Data Captured |
|-------|-------------|---------------|
| `application_error` | JavaScript error or exception | errorMessage, errorStack, context |

## Usage in Components

### Initialize Tracking

In your root layout or app component:

```typescript
import { tracking } from '@/lib/tracking';

useEffect(() => {
  tracking.init();
}, []);
```

### Mouse Tracking

```typescript
import { useMouseTracking } from '@/lib/tracking';

useEffect(() => {
  const cleanup = useMouseTracking();
  return cleanup;
}, []);
```

### Global Event Tracking

```typescript
import { useGlobalTracking } from '@/lib/tracking';

useEffect(() => {
  const cleanup = useGlobalTracking(currentTicketId);
  return cleanup;
}, [currentTicketId]);
```

### Track Custom Events

```typescript
import { tracking } from '@/lib/tracking';

// Track a specific decision
tracking.decisionMade({
  ticketId: 'T001',
  decisionType: 'priority',
  value: 'high',
  timestamp: Date.now()
});

// Track knowledge base search
tracking.knowledgeBaseSearched('refund policy', 5, Date.now());

// Track form validation error
tracking.formValidationError('ticket', 'priority', 'Priority is required', 'T001');
```

## Data Collection Architecture

### Dual Tracking System

1. **PostHog (Remote)**:
   - Real-time event capture
   - Session recordings
   - Automatic events (clicks, page views, etc.)
   - Error tracking

2. **LocalStorage (Client)**:
   - Buffered trace events
   - Automatic sync every 30 seconds
   - Final sync on survey completion

3. **File System (Server)**:
   - Persistent storage in `/data/collected/`
   - Format: `{participantId}_trace.json` and `{participantId}_survey.json`

### Data Flow

```
User Action
    ↓
tracking.trackEvent()
    ↓
├─→ PostHog API (real-time)
└─→ LocalStorage buffer
         ↓
    (every 30s or on completion)
         ↓
    POST /api/trace-data
         ↓
    File: data/collected/{participantId}_trace.json
```

## Privacy & Sampling

### Mouse Event Sampling

To reduce data volume while maintaining analytical value:
- **Mouse Clicks**: 10% random sample
- **Mouse Movements**: 1% random sample
- **Rage Clicks**: 100% capture (always tracked)

### Sensitive Data Handling

- Customer response text is captured for semantic analysis
- Use `.sensitive` CSS class to mask specific elements in session recordings
- Participant IDs are used (not personal information)

## Monitoring & Analysis

### PostHog Dashboard

Access your PostHog dashboard to:
- View real-time events
- Analyze user flows
- Watch session recordings
- Create custom insights
- Build funnels and retention analysis

### Local Data Export

Use the export API endpoint:

```bash
GET /api/export?participantId={id}&adminKey={key}
```

Returns all trace events and survey responses for analysis.

## Debugging

### Enable Development Mode Tracking

Set in `.env.local`:
```bash
NEXT_PUBLIC_POSTHOG_DISABLE_IN_DEV=false
```

### Console Logging

PostHog initialization logs to console:
```
[PostHog] Tracking enabled - capturing all events
```

### Verify Events

Check PostHog's "Live" events view or browser DevTools console to verify events are being captured.

## Best Practices

1. **Always track timing**: Include timestamps for temporal analysis
2. **Capture context**: Include ticketId and other relevant context with events
3. **Track changes**: Use `decision_changed` and similar events to track modifications
4. **Measure duration**: Track start/end events to calculate time spent
5. **Sample appropriately**: Use sampling for high-frequency events (mouse movements)
6. **Handle errors gracefully**: Tracking failures should not break the app

## Performance Considerations

- Event batching: PostHog batches events automatically
- LocalStorage limits: Trace events are cleared after sync
- Sampling: High-frequency events are sampled to reduce data volume
- Async operations: All tracking calls are non-blocking

## Compliance

- Ensure GDPR/privacy compliance in your region
- Inform participants about data collection
- Provide opt-out mechanisms if required
- Store data securely

---

For more information on PostHog features, visit: https://posthog.com/docs
