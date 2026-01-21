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
  | 'experiment_started'
  | 'ticket_opened'
  | 'ticket_closed'
  | 'decision_made'
  | 'mouse_click'
  | 'mouse_move'
  | 'customer_response_sent'
  | 'ai_step_accepted'
  | 'ai_step_rejected'
  | 'ai_step_edited'
  | 'chat_message_sent'
  | 'knowledge_base_opened'
  | 'survey_completed';

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
  comments?: string;
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
