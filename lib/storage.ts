import { SessionData, TraceEvent, TicketResponse } from '@/types';

const SESSION_KEY = 'experiment_session';
const TRACE_BUFFER_KEY = 'experiment_trace_buffer';

export const storage = {
  // Session Management
  getSession(): SessionData | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  setSession(session: SessionData): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  },

  updateSession(updates: Partial<SessionData>): void {
    const current = this.getSession();
    if (current) {
      this.setSession({ ...current, ...updates });
    }
  },

  clearSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TRACE_BUFFER_KEY);
  },

  // Trace Events Buffer
  addTraceEvent(event: TraceEvent): void {
    if (typeof window === 'undefined') return;

    const session = this.getSession();
    if (session) {
      session.traceEvents.push(event);
      this.setSession(session);
    }

    // Also add to buffer for syncing
    const buffer = this.getTraceBuffer();
    buffer.push(event);
    localStorage.setItem(TRACE_BUFFER_KEY, JSON.stringify(buffer));
  },

  getTraceBuffer(): TraceEvent[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(TRACE_BUFFER_KEY);
    return data ? JSON.parse(data) : [];
  },

  clearTraceBuffer(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TRACE_BUFFER_KEY, JSON.stringify([]));
  },

  // Ticket Responses
  addTicketResponse(response: TicketResponse): void {
    const session = this.getSession();
    if (session) {
      session.ticketResponses.push(response);
      this.setSession(session);
    }
  },

  getTicketResponses(): TicketResponse[] {
    const session = this.getSession();
    return session?.ticketResponses || [];
  },

  // Initialization
  initializeSession(
    participantId: string,
    group: '1' | '2' | '3' | '4',
    timingMode: 'immediate' | 'staggered'
  ): SessionData {
    const session: SessionData = {
      participantId,
      group,
      timingMode,
      startTime: Date.now(),
      ticketResponses: [],
      traceEvents: [],
    };
    this.setSession(session);
    return session;
  },
};
