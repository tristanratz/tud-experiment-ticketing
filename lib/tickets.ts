import { Ticket, TicketWithStatus, TicketResponse, TicketScore } from '@/types';
import ticketsData from '@/data/tickets.json';

export const ticketService = {
  // Load all tickets
  getAllTickets(): Ticket[] {
    return ticketsData.tickets;
  },

  // Get single ticket by ID
  getTicketById(id: string): Ticket | undefined {
    return ticketsData.tickets.find(ticket => ticket.id === id);
  },

  // Initialize tickets with status for a session
  initializeTicketsWithStatus(
    timingMode: 'immediate' | 'staggered',
    startTime: number
  ): TicketWithStatus[] {
    const tickets = this.getAllTickets();

    return tickets.map(ticket => {
      let status: 'locked' | 'available' = 'available';

      if (timingMode === 'staggered' && ticket.scheduledAppearance) {
        // Check if ticket should be available yet
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        status = elapsedSeconds >= ticket.scheduledAppearance ? 'available' : 'locked';
      }

      return {
        ...ticket,
        status,
      };
    });
  },

  // Update ticket status
  updateTicketStatus(
    tickets: TicketWithStatus[],
    ticketId: string,
    status: 'available' | 'in-progress' | 'completed',
    timestamp?: number
  ): TicketWithStatus[] {
    return tickets.map(ticket => {
      if (ticket.id === ticketId) {
        const updates: Partial<TicketWithStatus> = { status };

        if (status === 'in-progress' && !ticket.startedAt) {
          updates.startedAt = timestamp || Date.now();
        } else if (status === 'completed') {
          updates.completedAt = timestamp || Date.now();
        }

        return { ...ticket, ...updates };
      }
      return ticket;
    });
  },

  // Check which tickets should unlock (for staggered mode)
  checkUnlockTickets(
    tickets: TicketWithStatus[],
    startTime: number
  ): TicketWithStatus[] {
    const elapsedSeconds = (Date.now() - startTime) / 1000;

    return tickets.map(ticket => {
      if (
        ticket.status === 'locked' &&
        ticket.scheduledAppearance !== undefined &&
        elapsedSeconds >= ticket.scheduledAppearance
      ) {
        return { ...ticket, status: 'available' };
      }
      return ticket;
    });
  },

  // Calculate score for a ticket response
  scoreTicketResponse(response: TicketResponse): TicketScore {
    const ticket = this.getTicketById(response.ticketId);

    if (!ticket) {
      throw new Error(`Ticket ${response.ticketId} not found`);
    }

    const goldStandard = ticket.goldStandard;
    let errors = 0;
    let totalDecisions = 3; // priority, category, assignment

    // Check each decision against gold standard
    if (response.priority !== goldStandard.priority) errors++;
    if (response.category !== goldStandard.category) errors++;
    if (response.assignment !== goldStandard.assignment) errors++;

    const errorRate = errors / totalDecisions;
    const distanceFromGoldStandard = errorRate; // Simple distance metric
    const qualityScore = Math.round((1 - errorRate) * 100); // 0-100 scale

    // Calculate time metrics
    const timeToClose = response.timeToComplete;
    const timeToFirstResponse = timeToClose; // Simplified - would track separately in real system

    return {
      ticketId: response.ticketId,
      distanceFromGoldStandard,
      errorRate,
      qualityScore,
      timeToFirstResponse,
      timeToClose,
    };
  },

  // Calculate average performance metrics
  calculatePerformanceMetrics(responses: TicketResponse[]): {
    totalTickets: number;
    averageDistanceFromGoldStandard: number;
    averageErrorRate: number;
    averageQualityScore: number;
    averageTimeToClose: number;
  } {
    if (responses.length === 0) {
      return {
        totalTickets: 0,
        averageDistanceFromGoldStandard: 0,
        averageErrorRate: 0,
        averageQualityScore: 0,
        averageTimeToClose: 0,
      };
    }

    const scores = responses.map(r => this.scoreTicketResponse(r));

    return {
      totalTickets: responses.length,
      averageDistanceFromGoldStandard:
        scores.reduce((sum, s) => sum + s.distanceFromGoldStandard, 0) / scores.length,
      averageErrorRate:
        scores.reduce((sum, s) => sum + s.errorRate, 0) / scores.length,
      averageQualityScore:
        scores.reduce((sum, s) => sum + s.qualityScore, 0) / scores.length,
      averageTimeToClose:
        scores.reduce((sum, s) => sum + s.timeToClose, 0) / scores.length,
    };
  },

  // Validate ticket response
  validateResponse(response: Partial<TicketResponse>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!response.ticketId) errors.push('Ticket ID is required');
    if (!response.priority) errors.push('Priority selection is required');
    if (!response.category) errors.push('Category selection is required');
    if (!response.assignment) errors.push('Assignment selection is required');
    if (!response.customerResponse || response.customerResponse.trim() === '') {
      errors.push('Customer response is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
