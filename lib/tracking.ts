import posthog from 'posthog-js';
import { TraceEvent, GroupType, DecisionEvent, MouseClickEvent, MouseMoveEvent } from '@/types';
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
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.opt_out_capturing(); // Don't track in development
          }
        },
      });
      initialized = true;
    }
  },

  // Track custom event (both PostHog and local storage)
  track(eventType: TraceEvent['type'], data: any = {}): void {
    const event: TraceEvent = {
      type: eventType,
      timestamp: Date.now(),
      data,
    };

    // Store locally
    storage.addTraceEvent(event);

    // Send to PostHog
    if (initialized) {
      posthog.capture(eventType, data);
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
      messageLength: message.length,
      ticketId,
      timestamp: Date.now(),
    });
  },

  knowledgeBaseOpened(nodeId: string, nodeTitle: string): void {
    this.track('knowledge_base_opened', { nodeId, nodeTitle });
  },

  surveyCompleted(surveyData: any): void {
    this.track('survey_completed', surveyData);
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
export function useMouseTracking() {
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
