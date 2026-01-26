# PostHog Tracking Enhancements - Summary

## Overview

All PostHog tracking has been significantly enhanced to capture comprehensive behavioral data throughout the experiment platform. Automatic events are now enabled and 40+ custom event types have been added.

## Key Changes Made

### 1. **PostHog Configuration** (`lib/tracking.ts`)

#### Enabled All Automatic Features:
- ✅ **Autocapture**: Automatically tracks clicks, form submissions, and interactions
- ✅ **Pageview Tracking**: Auto-captures all page views
- ✅ **Pageleave Tracking**: Tracks when users leave pages
- ✅ **Dead Click Tracking**: Detects frustration clicks (clicks with no effect)
- ✅ **Rage Click Detection**: Tracks rapid repeated clicks (user frustration)
- ✅ **Session Recording**: Records user sessions with screen replay
- ✅ **Console Log Capture**: Captures console logs during sessions
- ✅ **Error Tracking**: Auto-captures JavaScript errors and promise rejections

#### Development Mode Control:
```bash
# In .env.local
NEXT_PUBLIC_POSTHOG_DISABLE_IN_DEV=false  # Now tracking works in development too
```

### 2. **New Event Types Added** (40+ events)

#### Core Experiment Events
- `experiment_started` - Participant begins
- `experiment_paused` - Experiment paused
- `experiment_resumed` - Experiment resumed
- `experiment_time_expired` - 15-minute timer expired

#### Ticket Events
- `ticket_opened` - Ticket detail view accessed
- `ticket_closed` - Ticket completed
- `ticket_view_duration` - Time spent on ticket
- `ticket_list_filtered` - List filtered
- `ticket_list_sorted` - List sorted

#### Decision Events
- `decision_made` - Decision selected
- `decision_changed` - Decision modified
- `first_decision_timing` - Time to first decision
- `dropdown_opened` - Dropdown menu opened
- `dropdown_closed` - Dropdown closed

#### Customer Response Events
- `customer_response_sent` - Response submitted
- `response_text_changed` - Text edited (typed/pasted/deleted)

#### AI Agent Events (Groups 3 & 4)
- `ai_agent_started` - AI processing begins
- `ai_agent_completed` - AI processing complete
- `ai_agent_step_viewed` - AI step displayed
- `ai_step_accepted` - Step accepted
- `ai_step_rejected` - Step rejected
- `ai_step_edited` - Step modified

#### Chat Events (Group 2)
- `chat_message_sent` - Message sent
- `chat_response_copied` - AI response copied
- `chat_response_inserted` - Response inserted to ticket

#### Knowledge Base Events (Group 1)
- `knowledge_base_opened` - Node clicked
- `knowledge_base_searched` - Search performed (with debounce)

#### Survey Events
- `survey_completed` - Survey submitted
- `survey_question_answered` - Individual question answered (tracks each question separately)

#### Sidebar Events
- `sidebar_section_focused` - Section activated
- `sidebar_interaction_started` - Interaction begins
- `sidebar_interaction_ended` - Interaction ends (with duration)

#### Behavioral Tracking
- `mouse_click` - Click events (10% sample)
- `mouse_move` - Mouse movement with velocity (1% sample)
- `rage_click_detected` - Frustration behavior (100% tracked)

#### Focus & Attention
- `window_focus_changed` - Window focus/blur
- `tab_visibility_changed` - Tab visibility changed

#### Navigation & Performance
- `page_viewed` - Page navigation
- `page_performance` - Page load metrics

#### Timer Events
- `timer_warning` - Time warnings at 5min, 2min, 1min marks

#### Data Sync Events
- `data_synced` - Successful sync (auto/manual/final)
- `data_sync_failed` - Sync failure with error

#### Error Tracking
- `form_validation_error` - Form validation errors
- `application_error` - JavaScript exceptions

### 3. **Global Tracking Hooks**

#### New Hook: `useGlobalTracking()`
Automatically tracks:
- Window focus changes
- Tab visibility changes
- JavaScript errors
- Unhandled promise rejections

#### Enhanced: `useMouseTracking()`
- Existing mouse tracking maintained
- Integrated with rage click detection

#### New: `trackPagePerformance()`
- Measures DOM load time
- Tracks page interactive timing
- Captures load completion time

#### New: `detectRageClicks()`
- Detects 3+ clicks in same area within 2 seconds
- Automatically triggers rage click event

### 4. **Component Updates**

#### `/app/experiment/page.tsx`
- ✅ Added global tracking hook
- ✅ Added page view tracking on mount
- ✅ Added page performance tracking
- ✅ Added timer warnings at 5min, 2min, 1min
- ✅ Track experiment time expiration
- ✅ Track data sync success/failure
- ✅ Track ticket opened event

#### `/app/survey/page.tsx`
- ✅ Added page view tracking
- ✅ Added page performance tracking
- ✅ Enhanced data sync tracking with error handling
- ✅ Track final sync events

#### `/components/survey/SurveyForm.tsx`
- ✅ Track each survey question answer individually
- ✅ Real-time tracking as users change answers

#### `/components/experiment/KnowledgeBase.tsx`
- ✅ Track knowledge base searches
- ✅ Debounced (500ms) to avoid tracking every keystroke
- ✅ Tracks search query and result count

### 5. **TypeScript Types Updated**

All new event types added to `TraceEventType` union in `types/index.ts`:
- 40+ new event type definitions
- Proper type safety for all tracking calls

### 6. **Documentation Created**

#### `TRACKING.md`
Comprehensive 300+ line documentation covering:
- Configuration instructions
- Complete event type reference
- Usage examples for each tracking method
- Data collection architecture
- Privacy & sampling strategies
- Best practices
- Debugging guide

#### `TRACKING_ENHANCEMENTS.md` (this file)
Summary of all changes made

## Data Collection Flow

```
User Action
    ↓
tracking.trackEvent()
    ↓
├─→ PostHog API (real-time)
│   ├─→ Event capture
│   ├─→ Session recording
│   ├─→ Automatic events (clicks, pageviews, etc.)
│   └─→ Error tracking
└─→ LocalStorage buffer
         ↓
    (every 30s or on completion)
         ↓
    POST /api/trace-data
         ↓
    File: data/collected/{participantId}_trace.json
```

## What's Tracked Now (Complete List)

### Automatic Events (PostHog Built-in)
1. All page views
2. All page leaves
3. All DOM click events
4. All form submissions
5. Dead clicks (frustration indicator)
6. Rage clicks (rapid clicking)
7. Page scrolling
8. JavaScript errors
9. Console logs (in session recordings)
10. Network requests (in session recordings)

### Custom Events (40+ Types)
See sections above for complete breakdown by category.

### Total Data Points Per Participant

Estimated data points collected:
- **Automatic events**: 100-500+ depending on interaction level
- **Custom events**: 50-200 depending on tickets completed
- **Mouse tracking**: 10-50 (sampled)
- **Survey**: 8 questions
- **Session recording**: Full visual replay available

## Testing the Tracking

### 1. Enable Development Tracking

```bash
# In .env.local
NEXT_PUBLIC_POSTHOG_DISABLE_IN_DEV=false
```

### 2. Check Browser Console

Look for:
```
[PostHog] Tracking enabled - capturing all events
```

### 3. View Events in PostHog

1. Go to your PostHog dashboard
2. Navigate to "Activity" → "Live Events"
3. Perform actions in the experiment
4. See events appear in real-time

### 4. Verify Session Recordings

1. PostHog dashboard → "Session Recordings"
2. Your sessions should appear with full replay capability

## Privacy Considerations

### Sampling Rates
- Mouse clicks: 10% sample (reduces data volume)
- Mouse movements: 1% sample (reduces data volume)
- Rage clicks: 100% (important frustration indicator)

### Sensitive Data
- Customer response text IS captured (for semantic analysis per requirements)
- Add `.sensitive` CSS class to any element to mask it in session recordings
- Participant IDs are used (not personal information)

### Session Recordings
- Full screen recordings are enabled
- Input masking is disabled (to capture form interactions)
- Use `.sensitive` class to mask specific elements if needed

## Performance Impact

- **Minimal**: PostHog batches events automatically
- **Non-blocking**: All tracking calls are asynchronous
- **Optimized**: High-frequency events (mouse) are sampled
- **Cached**: LocalStorage buffer prevents data loss

## Next Steps

### Recommended Actions

1. **Test in Development**
   - Set `NEXT_PUBLIC_POSTHOG_DISABLE_IN_DEV=false`
   - Go through experiment flow
   - Verify events in PostHog dashboard

2. **Review Session Recordings**
   - Check that recordings work correctly
   - Verify no sensitive data is exposed
   - Adjust masking if needed

3. **Analyze Event Data**
   - Create custom insights in PostHog
   - Build funnels for ticket completion
   - Analyze behavioral patterns

4. **Export for Research**
   - Use `/api/export` endpoint for raw data
   - Combine PostHog data with local trace files
   - Perform statistical analysis

### Optional Enhancements

If you want even more tracking, consider adding:
- Scroll depth tracking (how far users scroll in knowledge base)
- Copy/paste tracking in text areas
- Keyboard shortcut usage
- Time spent in each dropdown before selecting
- Hover duration over UI elements
- Browser/device information (PostHog captures this automatically)

## Files Modified

1. ✅ `lib/tracking.ts` - Enhanced configuration + 40+ new tracking methods
2. ✅ `types/index.ts` - Added all new event types
3. ✅ `.env.local` - Added dev mode control flag
4. ✅ `app/experiment/page.tsx` - Enhanced with comprehensive tracking
5. ✅ `app/survey/page.tsx` - Added page tracking + enhanced sync tracking
6. ✅ `components/survey/SurveyForm.tsx` - Individual question tracking
7. ✅ `components/experiment/KnowledgeBase.tsx` - Search tracking
8. ✅ `TRACKING.md` - Created comprehensive documentation
9. ✅ `TRACKING_ENHANCEMENTS.md` - This summary document

## Summary

Your experiment platform now has **world-class behavioral tracking** that captures:
- ✅ Every user interaction
- ✅ Every decision point
- ✅ Performance metrics
- ✅ Behavioral patterns
- ✅ Error states
- ✅ Survey responses
- ✅ Session replays
- ✅ Frustration indicators

All automatic PostHog features are enabled, giving you maximum insight into participant behavior during the experiment. The data collected will provide rich material for your research analysis.

**Total enhancement**: From ~12 event types to **40+ event types** + automatic event capture + session recordings + error tracking.
