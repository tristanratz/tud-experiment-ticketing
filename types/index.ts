// Experimental Groups
export type GroupType = '1' | '2' | '3' | '4';
export type TimingMode = 'immediate' | 'staggered';

// Ticket System
export interface Ticket {
  id: string;
  customer: string;
  email: string;
  subject: string;
  description: string;
  decisionPoints: {
    priority: string[];
    category: string[];
    assignment: string[];
  };
  goldStandard: {
    priority: string;
    category: string;
    assignment: string;
    responseTemplate: string;
  };
  scheduledAppearance?: number; // seconds from start for staggered mode
}

export interface TicketResponse {
  ticketId: string;
  priority: string;
  category: string;
  assignment: string;
  customerResponse: string;
  completedAt: number; // timestamp
  timeToComplete: number; // milliseconds
}

export type TicketStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export interface TicketWithStatus extends Ticket {
  status: TicketStatus;
  startedAt?: number;
  completedAt?: number;
}

// Decision Tracking
export interface DecisionEvent {
  ticketId: string;
  decisionType: 'priority' | 'category' | 'assignment';
  value: string;
  timestamp: number;
  timeSinceLastDecision?: number; // milliseconds
}

// AI Agent
export interface AIAgentStep {
  stepNumber: number;
  stepName: string;
  decision: string;
  reasoning: string;
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
}

export interface AIAgentResult {
  ticketId: string;
  steps: AIAgentStep[];
  finalResponse: string;
  approved: boolean;
}

// Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Knowledge Base
export interface KnowledgeNode {
  id: string;
  title: string;
  content?: string; // markdown content
  children?: KnowledgeNode[];
  expanded?: boolean;
}

// Mouse Tracking
export interface MouseClickEvent {
  x: number;
  y: number;
  timestamp: number;
  elementType?: string;
  elementId?: string;
}

export interface MouseMoveEvent {
  x: number;
  y: number;
  timestamp: number;
  velocity?: number; // pixels per second
}

// Trace Data
export type TraceEventType =
  // Core experiment events
  | 'experiment_started'
  | 'experiment_paused'
  | 'experiment_resumed'
  | 'experiment_time_expired'
  // Ticket events
  | 'ticket_opened'
  | 'ticket_closed'
  | 'ticket_view_duration'
  | 'ticket_list_filtered'
  | 'ticket_list_sorted'
  // Decision events
  | 'decision_made'
  | 'decision_changed'
  | 'first_decision_timing'
  | 'dropdown_opened'
  | 'dropdown_closed'
  // Mouse tracking
  | 'mouse_click'
  | 'mouse_move'
  // Customer response events
  | 'customer_response_sent'
  | 'response_text_changed'
  // AI agent events
  | 'ai_agent_started'
  | 'ai_agent_completed'
  | 'ai_agent_step_viewed'
  | 'ai_step_accepted'
  | 'ai_step_rejected'
  | 'ai_step_edited'
  // Chat events
  | 'chat_message_sent'
  | 'chat_message_received'
  | 'chat_response_copied'
  | 'chat_response_inserted'
  // Knowledge base events
  | 'knowledge_base_opened'
  | 'knowledge_base_searched'
  // Survey events
  | 'survey_completed'
  | 'survey_question_answered'
  // Sidebar interaction events
  | 'sidebar_section_focused'
  | 'sidebar_interaction_started'
  | 'sidebar_interaction_ended'
  // Page navigation
  | 'page_viewed'
  | 'page_performance'
  // Timer events
  | 'timer_warning'
  // Rage click detection
  | 'rage_click_detected'
  // Data sync events
  | 'data_synced'
  | 'data_sync_failed'
  // Form validation
  | 'form_validation_error'
  // Focus and attention tracking
  | 'window_focus_changed'
  | 'tab_visibility_changed'
  // Error tracking
  | 'application_error';

export interface TraceEvent {
  type: TraceEventType;
  timestamp: number;
  data: any;
}

// Session
export interface SessionData {
  participantId: string;
  group: GroupType;
  timingMode: TimingMode;
  prolificRedirectUrl?: string;
  startTime: number;
  endTime?: number;
  ticketResponses: TicketResponse[];
  traceEvents: TraceEvent[];
}

// Survey
export interface SurveyResponse {
  participantId: string;
  perceivedStress: number; // 1-10 scale
  decisionConfidence: number; // 1-10 scale
  selfEfficacy: number; // 1-10 scale
  trustInSystem: number; // 1-10 scale
  trustInSelf: number; // 1-10 scale
  trustInDecisions: number; // 1-10 scale
  processEngagement: number; // 1-10 scale
  comments: string;
  completedAt: number;
}

// Scoring
export interface TicketScore {
  ticketId: string;
  distanceFromGoldStandard: number; // 0-1, 0 is perfect match
  errorRate: number; // 0-1
  qualityScore: number; // 0-100
  timeToFirstResponse: number; // milliseconds
  timeToClose: number; // milliseconds
}

export interface ParticipantPerformance {
  participantId: string;
  group: GroupType;
  totalTicketsResolved: number;
  averageDistanceFromGoldStandard: number;
  averageErrorRate: number;
  averageQualityScore: number;
  averageTimeToFirstResponse: number;
  averageTimeToClose: number;
  totalMouseClicks: number;
  averageMouseVelocity: number;
  surveyScores?: SurveyResponse;
}
