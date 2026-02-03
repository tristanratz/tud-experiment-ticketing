import posthog from 'posthog-js';
import { TraceEvent, GroupType, DecisionEvent, MouseClickEvent, MouseMoveEvent, SurveyResponse } from '@/types';
import { storage } from './storage';

let initialized = false;

export const tracking = {
  // Initialize PostHog
  init(): void {
    if (initialized || typeof window === 'undefined') return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (key && host) {
      posthog.init(key, {
        api_host: host,
        // Enable ALL automatic event capture features
        autocapture: true, // Automatically capture clicks, form submissions, and other interactions
        capture_pageview: true, // Automatically capture page views
        capture_pageleave: true, // Capture when users leave pages
        capture_dead_clicks: true, // Track clicks that don't lead to actions (user frustration)
        rageclick: true, // Track rage clicks (rapid repeated clicks - user frustration)
        persistence: 'localStorage', // Persist user data across sessions
        session_recording: {
          recordCrossOriginIframes: false,
          maskAllInputs: false, // We want to capture input content for analysis
          maskTextSelector: '.sensitive', // Only mask elements with 'sensitive' class
        },
        // Enable additional automatic features
        enable_recording_console_log: true, // Capture console logs in session recordings
        disable_persistence: false, // Keep persistence enabled
        sanitize_properties: null, // Don't sanitize properties - capture everything
        property_blacklist: [], // Don't blacklist any properties
        // Avoid custom headers to prevent CORS preflight failures.
        loaded: (posthog) => {
          // Only opt out in development if explicitly set
          if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_POSTHOG_DISABLE_IN_DEV === 'true') {
            posthog.opt_out_capturing();
            console.log('[PostHog] Tracking disabled in development mode');
          } else {
            console.log('[PostHog] Tracking enabled - capturing all events');
          }
        },
      });
      initialized = true;
    }
  },

  // Track custom event (both PostHog and local storage)
  track(eventType: TraceEvent['type'], data: Record<string, unknown> | object = {}): void {
    const session = storage.getSession();
    const withParticipant = typeof data === 'object' && data !== null
      ? { ...(data as Record<string, unknown>) }
      : {};
    if (session?.participantId && !('participantId' in withParticipant)) {
      withParticipant.participantId = session.participantId;
    }

    const event: TraceEvent = {
      type: eventType,
      timestamp: Date.now(),
      data: withParticipant,
    };

    // Store locally
    storage.addTraceEvent(event);

    // Send to PostHog
    if (initialized) {
      posthog.capture(eventType, withParticipant);
    }
  },

  // Specific tracking methods
  experimentStarted(participantId: string, group: GroupType, timingMode: string): void {
    this.track('experiment_started', { participantId, group, timingMode });

    if (initialized) {
      posthog.identify(participantId, { group, timingMode });
    }
  },

  ticketOpened(ticketId: string, timestamp: number): void {
    this.track('ticket_opened', { ticketId, timestamp });
  },

  ticketClosed(ticketId: string, timestamp: number, timeToComplete: number): void {
    this.track('ticket_closed', { ticketId, timestamp, timeToComplete });
  },

  decisionMade(decision: DecisionEvent): void {
    this.track('decision_made', decision);
  },

  mouseClick(event: MouseClickEvent): void {
    // Sample mouse clicks (only track ~10% to reduce data volume)
    if (Math.random() < 0.1) {
      this.track('mouse_click', event);
    }
  },

  mouseMove(event: MouseMoveEvent): void {
    // Sample mouse movements (only track ~1% to reduce data volume)
    if (Math.random() < 0.01) {
      this.track('mouse_move', event);
    }
  },

  customerResponseSent(ticketId: string, responseText: string, timestamp: number): void {
    this.track('customer_response_sent', {
      ticketId,
      responseText,
      responseLength: responseText.length,
      timestamp,
    });
  },

  aiStepAccepted(ticketId: string, stepNumber: number, stepName: string): void {
    this.track('ai_step_accepted', { ticketId, stepNumber, stepName });
  },

  aiStepRejected(ticketId: string, stepNumber: number, stepName: string): void {
    this.track('ai_step_rejected', { ticketId, stepNumber, stepName });
  },

  aiStepEdited(ticketId: string, stepNumber: number, stepName: string, newValue: string): void {
    this.track('ai_step_edited', { ticketId, stepNumber, stepName, newValue });
  },

  chatMessageSent(message: string, ticketId?: string): void {
    this.track('chat_message_sent', {
      message,
      messageLength: message.length,
      ticketId,
      timestamp: Date.now(),
    });
  },

  chatMessageReceived(message: string, ticketId?: string, source?: 'assistant' | 'system'): void {
    this.track('chat_message_received', {
      message,
      messageLength: message.length,
      ticketId,
      source: source || 'assistant',
      timestamp: Date.now(),
    });
  },

  knowledgeBaseOpened(nodeId: string, nodeTitle: string): void {
    this.track('knowledge_base_opened', { nodeId, nodeTitle });
  },

  surveyCompleted(surveyData: SurveyResponse): void {
    this.track('survey_completed', surveyData);
  },

  surveySubmitted(surveyData: SurveyResponse): void {
    this.track('survey_submitted', surveyData);
  },

  // Additional comprehensive tracking methods

  // Knowledge base search tracking
  knowledgeBaseSearched(query: string, resultsCount: number, timestamp: number): void {
    this.track('knowledge_base_searched', {
      query,
      resultsCount,
      queryLength: query.length,
      timestamp
    });
  },

  // Form validation and error tracking
  formValidationError(formType: string, field: string, errorMessage: string, ticketId?: string): void {
    this.track('form_validation_error', {
      formType,
      field,
      errorMessage,
      ticketId,
      timestamp: Date.now()
    });
  },

  // Page/view navigation tracking
  pageViewed(pageName: string, previousPage?: string): void {
    this.track('page_viewed', {
      pageName,
      previousPage,
      timestamp: Date.now()
    });
  },

  // Survey interaction tracking (individual questions)
  surveyQuestionAnswered(questionId: string, questionText: string, answer: unknown, timestamp: number): void {
    this.track('survey_question_answered', {
      questionId,
      questionText,
      answer,
      timestamp
    });
  },

  // Decision retry/change tracking
  decisionChanged(ticketId: string, decisionType: string, oldValue: string, newValue: string, timestamp: number): void {
    this.track('decision_changed', {
      ticketId,
      decisionType,
      oldValue,
      newValue,
      timestamp
    });
  },

  // Sidebar interaction tracking
  sidebarSectionFocused(section: 'knowledge-base' | 'chat' | 'ai-info', ticketId?: string, timestamp?: number): void {
    this.track('sidebar_section_focused', {
      section,
      ticketId,
      timestamp: timestamp || Date.now()
    });
  },

  sidebarInteractionStarted(section: string): void {
    this.track('sidebar_interaction_started', {
      section,
      timestamp: Date.now()
    });
  },

  sidebarInteractionEnded(section: string, durationMs: number): void {
    this.track('sidebar_interaction_ended', {
      section,
      durationMs,
      timestamp: Date.now()
    });
  },

  // Ticket list interactions
  ticketListFiltered(filterType: string, filterValue: string): void {
    this.track('ticket_list_filtered', {
      filterType,
      filterValue,
      timestamp: Date.now()
    });
  },

  ticketListSorted(sortBy: string, sortOrder: 'asc' | 'desc'): void {
    this.track('ticket_list_sorted', {
      sortBy,
      sortOrder,
      timestamp: Date.now()
    });
  },

  // Process bar and timer tracking
  timerWarning(remainingSeconds: number, warningType: '5min' | '2min' | '1min'): void {
    this.track('timer_warning', {
      remainingSeconds,
      warningType,
      timestamp: Date.now()
    });
  },

  experimentTimeExpired(completedTickets: number, totalTickets: number): void {
    this.track('experiment_time_expired', {
      completedTickets,
      totalTickets,
      timestamp: Date.now()
    });
  },

  // Auto-save and data sync tracking
  dataSynced(eventsCount: number, syncType: 'auto' | 'manual' | 'final'): void {
    this.track('data_synced', {
      eventsCount,
      syncType,
      timestamp: Date.now()
    });
  },

  dataSyncFailed(error: string, eventsCount: number): void {
    this.track('data_sync_failed', {
      error,
      eventsCount,
      timestamp: Date.now()
    });
  },

  // Chat assistant specific tracking
  chatResponseCopied(responseLength: number, ticketId?: string): void {
    this.track('chat_response_copied', {
      responseLength,
      ticketId,
      timestamp: Date.now()
    });
  },

  chatResponseInserted(responseLength: number, ticketId: string, insertionMethod: 'button' | 'manual'): void {
    this.track('chat_response_inserted', {
      responseLength,
      ticketId,
      insertionMethod,
      timestamp: Date.now()
    });
  },

  // AI agent tracking enhancements
  aiAgentStarted(ticketId: string, agentType: 'confirm' | 'auto'): void {
    this.track('ai_agent_started', {
      ticketId,
      agentType,
      timestamp: Date.now()
    });
  },

  aiAgentCompleted(ticketId: string, agentType: 'confirm' | 'auto', totalSteps: number, timeToComplete: number): void {
    this.track('ai_agent_completed', {
      ticketId,
      agentType,
      totalSteps,
      timeToComplete,
      timestamp: Date.now()
    });
  },

  aiAgentStepViewed(ticketId: string, stepNumber: number, stepName: string, timeOnStep: number): void {
    this.track('ai_agent_step_viewed', {
      ticketId,
      stepNumber,
      stepName,
      timeOnStep,
      timestamp: Date.now()
    });
  },

  // Ticket response draft tracking
  responseTextChanged(ticketId: string, textLength: number, changeType: 'typed' | 'pasted' | 'deleted'): void {
    this.track('response_text_changed', {
      ticketId,
      textLength,
      changeType,
      timestamp: Date.now()
    });
  },

  // Dropdown interaction tracking
  dropdownOpened(ticketId: string, dropdownType: string): void {
    this.track('dropdown_opened', {
      ticketId,
      dropdownType,
      timestamp: Date.now()
    });
  },

  dropdownClosed(ticketId: string, dropdownType: string, selectionMade: boolean): void {
    this.track('dropdown_closed', {
      ticketId,
      dropdownType,
      selectionMade,
      timestamp: Date.now()
    });
  },

  // Focus and attention tracking
  windowFocusChanged(hasFocus: boolean, ticketId?: string): void {
    this.track('window_focus_changed', {
      hasFocus,
      ticketId,
      timestamp: Date.now()
    });
  },

  tabVisibilityChanged(isVisible: boolean, ticketId?: string): void {
    this.track('tab_visibility_changed', {
      isVisible,
      ticketId,
      timestamp: Date.now()
    });
  },

  // Performance and timing tracking
  firstDecisionTiming(ticketId: string, timeToFirstDecision: number, decisionType: string): void {
    this.track('first_decision_timing', {
      ticketId,
      timeToFirstDecision,
      decisionType,
      timestamp: Date.now()
    });
  },

  ticketViewDuration(ticketId: string, durationMs: number, completed: boolean): void {
    this.track('ticket_view_duration', {
      ticketId,
      durationMs,
      completed,
      timestamp: Date.now()
    });
  },

  // Error and exception tracking
  applicationError(errorMessage: string, errorStack?: string, context?: Record<string, unknown>): void {
    this.track('application_error', {
      errorMessage,
      errorStack,
      context,
      timestamp: Date.now()
    });

    // Also send to PostHog's exception tracking
    if (initialized) {
      posthog.capture('$exception', {
        $exception_message: errorMessage,
        $exception_type: 'Application Error',
        $exception_stack: errorStack,
        ...context
      });
    }
  },

  // Experiment flow tracking
  experimentPaused(reason: string, ticketId?: string): void {
    this.track('experiment_paused', {
      reason,
      ticketId,
      timestamp: Date.now()
    });
  },

  experimentResumed(pausedDurationMs: number, ticketId?: string): void {
    this.track('experiment_resumed', {
      pausedDurationMs,
      ticketId,
      timestamp: Date.now()
    });
  },

  // Calculate mouse velocity
  calculateMouseVelocity(
    previousEvent: MouseMoveEvent,
    currentEvent: MouseMoveEvent
  ): number {
    const deltaX = currentEvent.x - previousEvent.x;
    const deltaY = currentEvent.y - previousEvent.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const deltaTime = (currentEvent.timestamp - previousEvent.timestamp) / 1000; // Convert to seconds
    const velocity = deltaTime > 0 ? distance / deltaTime : 0;

    return velocity;
  },
};

// Mouse tracking hook
export function setupMouseTracking() {
  if (typeof window === 'undefined') return;

  let lastMouseMove: MouseMoveEvent | null = null;

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    tracking.mouseClick({
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
      elementType: target.tagName,
      elementId: target.id || undefined,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    const currentMove: MouseMoveEvent = {
      x: e.clientX,
      y: e.clientY,
      timestamp: Date.now(),
    };

    if (lastMouseMove) {
      currentMove.velocity = tracking.calculateMouseVelocity(lastMouseMove, currentMove);
    }

    tracking.mouseMove(currentMove);
    lastMouseMove = currentMove;
  };

  // Attach listeners
  document.addEventListener('click', handleClick);
  document.addEventListener('mousemove', handleMouseMove);

  // Cleanup function
  return () => {
    document.removeEventListener('click', handleClick);
    document.removeEventListener('mousemove', handleMouseMove);
  };
}

// Global tracking hooks for window/document events
export function setupGlobalTracking(currentTicketId?: string) {
  if (typeof window === 'undefined') return;

  // Window focus tracking
  const handleFocus = () => {
    tracking.windowFocusChanged(true, currentTicketId);
  };

  const handleBlur = () => {
    tracking.windowFocusChanged(false, currentTicketId);
  };

  // Tab visibility tracking
  const handleVisibilityChange = () => {
    tracking.tabVisibilityChanged(!document.hidden, currentTicketId);
  };

  // Error tracking
  const handleError = (event: ErrorEvent) => {
    tracking.applicationError(
      event.message,
      event.error?.stack,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        currentTicketId
      }
    );
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    tracking.applicationError(
      'Unhandled Promise Rejection',
      event.reason?.stack || String(event.reason),
      {
        type: 'promise_rejection',
        currentTicketId
      }
    );
  };

  // Attach all listeners
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  // Cleanup function
  return () => {
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}

// Performance tracking utility
export function trackPagePerformance(pageName: string) {
  if (typeof window === 'undefined' || !window.performance) return;

  const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (perfData) {
    tracking.track('page_performance', {
      pageName,
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
      domInteractive: perfData.domInteractive - perfData.fetchStart,
      timestamp: Date.now()
    });
  }
}

// Enhanced mouse tracking with click pattern detection
let clickHistory: { timestamp: number; x: number; y: number }[] = [];

export function detectRageClicks() {
  if (typeof window === 'undefined') return;

  const handleClick = (e: MouseEvent) => {
    const now = Date.now();
    clickHistory.push({ timestamp: now, x: e.clientX, y: e.clientY });

    // Keep only last 10 seconds of clicks
    clickHistory = clickHistory.filter(click => now - click.timestamp < 10000);

    // Detect rage clicks: 3+ clicks in same area (50px radius) within 2 seconds
    const recentClicks = clickHistory.filter(click => now - click.timestamp < 2000);
    if (recentClicks.length >= 3) {
      const sameAreaClicks = recentClicks.filter(click => {
        const distance = Math.sqrt(
          Math.pow(click.x - e.clientX, 2) + Math.pow(click.y - e.clientY, 2)
        );
        return distance < 50;
      });

      if (sameAreaClicks.length >= 3) {
        tracking.track('rage_click_detected', {
          x: e.clientX,
          y: e.clientY,
          clickCount: sameAreaClicks.length,
          timestamp: now
        });
        // Clear history after detecting rage click to avoid multiple triggers
        clickHistory = [];
      }
    }
  };

  document.addEventListener('click', handleClick);

  return () => {
    document.removeEventListener('click', handleClick);
  };
}
