import { Ticket, AIAgentStep, ChatMessage } from '@/types';
import { ticketService } from './tickets';

export const aiMockService = {
  // Generate AI agent steps for a ticket (Group 3 & 4)
  generateAgentSteps(ticket: Ticket): AIAgentStep[] {
    const goldStandard = ticket.goldStandard;

    return [
      {
        stepNumber: 1,
        stepName: 'Analyze Customer Issue',
        decision: `Customer: ${ticket.customer} - Issue: ${ticket.subject}`,
        reasoning: `Based on the ticket description, the customer is experiencing "${ticket.subject}". This requires careful attention to ensure proper resolution.`,
        status: 'pending',
      },
      {
        stepNumber: 2,
        stepName: 'Determine Priority',
        decision: goldStandard.priority,
        reasoning: `This issue should be classified as ${goldStandard.priority} priority because ${this.getPriorityReasoning(goldStandard.priority, ticket.description)}.`,
        status: 'pending',
      },
      {
        stepNumber: 3,
        stepName: 'Categorize Issue',
        decision: goldStandard.category,
        reasoning: `This falls under the ${goldStandard.category} category as ${this.getCategoryReasoning(goldStandard.category)}.`,
        status: 'pending',
      },
      {
        stepNumber: 4,
        stepName: 'Assign to Team',
        decision: goldStandard.assignment,
        reasoning: `This should be handled by ${goldStandard.assignment} because ${this.getAssignmentReasoning(goldStandard.assignment, goldStandard.category)}.`,
        status: 'pending',
      },
      {
        stepNumber: 5,
        stepName: 'Draft Customer Response',
        decision: 'Response drafted',
        reasoning: 'I\'ve prepared a professional and empathetic response addressing the customer\'s concerns.',
        status: 'pending',
      },
    ];
  },

  // Generate complete response for autonomous mode (Group 4)
  generateCompleteResponse(ticket: Ticket): string {
    return ticket.goldStandard.responseTemplate;
  },

  // Priority reasoning helper
  getPriorityReasoning(priority: string, description: string): string {
    const reasons: Record<string, string> = {
      'Low': 'it\'s a general inquiry that doesn\'t require immediate action',
      'Medium': 'it affects the customer experience but isn\'t time-critical',
      'High': 'it significantly impacts the customer\'s ability to use our service',
      'Urgent': 'it requires immediate attention to prevent customer loss or significant dissatisfaction',
    };
    return reasons[priority] || 'of the nature of the issue';
  },

  // Category reasoning helper
  getCategoryReasoning(category: string): string {
    const reasons: Record<string, string> = {
      'Technical': 'it involves system functionality or access issues',
      'Account': 'it relates to user account management and settings',
      'Billing': 'it concerns payment, charges, or refund matters',
      'Order': 'it pertains to product purchases, delivery, or returns',
    };
    return reasons[category] || 'it best matches this classification';
  },

  // Assignment reasoning helper
  getAssignmentReasoning(assignment: string, category: string): string {
    const reasons: Record<string, string> = {
      'Tier 1': 'it can be resolved with standard procedures and doesn\'t require specialized knowledge',
      'Tier 2': 'it requires technical expertise or account-level access beyond Tier 1 capabilities',
      'Specialist': 'it involves complex issues that need specialized expertise or higher-level authorization',
    };
    return reasons[assignment] || 'of the complexity level';
  },

  // Chat Assistant - Answer knowledge base questions (Group 2)
  async generateChatResponse(userMessage: string, ticketContext?: Ticket): Promise<string> {
    const lowerMessage = userMessage.toLowerCase();

    // Return policy
    if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      return 'Our return policy allows returns within 30 days of purchase for items in original condition with tags attached. Refunds are processed within 5-7 business days. Holiday purchases have an extended 60-day return window.';
    }

    // Shipping policy
    if (lowerMessage.includes('ship') || lowerMessage.includes('delivery')) {
      return 'We offer Standard Shipping (5-7 days, free over $50), Expedited Shipping (2-3 days, $12.99), and Overnight Shipping (1 day, $24.99). International shipping is available to Canada only.';
    }

    // Login issues
    if (lowerMessage.includes('login') || lowerMessage.includes('password') || lowerMessage.includes('account locked')) {
      return 'For login issues: Accounts are locked after 5 failed attempts. Wait 30 minutes for automatic unlock or use "Forgot Password" for immediate reset. For immediate manual unlock, verify customer identity with billing address and last 4 digits of payment method.';
    }

    // Payment errors
    if (lowerMessage.includes('payment') || lowerMessage.includes('checkout')) {
      return 'Payment errors can be caused by insufficient funds, card declined by bank, or technical issues. Try: 1) Verify card information, 2) Try different payment method, 3) Clear browser cache, 4) Try different browser. For persistent issues, offer to process order manually.';
    }

    // Duplicate charges
    if (lowerMessage.includes('duplicate') || lowerMessage.includes('charged twice')) {
      return 'For duplicate charges: First verify if it\'s an authorization hold vs actual charge. Authorization holds drop within 3-5 days. True duplicates require immediate refund processing (5-7 business days) plus account credit for inconvenience.';
    }

    // Promotional codes
    if (lowerMessage.includes('promo') || lowerMessage.includes('code') || lowerMessage.includes('discount')) {
      return 'Common promo code issues: 1) Code expired, 2) Minimum purchase not met, 3) Category restrictions, 4) One per customer limit, 5) Cannot combine with sales. Check code terms and consider manual discount as courtesy.';
    }

    // Product recommendations
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      return 'For product recommendations, consider: Budget, use case (office/gaming/programming), ergonomic needs, and compatibility requirements. Our top picks include ErgoTech Wireless Mouse Pro ($69.99) for programming and TypePro Mechanical keyboard ($129.99) for typing.';
    }

    // Missing orders
    if (lowerMessage.includes('not received') || lowerMessage.includes('never arrived') || lowerMessage.includes('missing')) {
      return 'For missing orders: 1) Verify delivery address, 2) Check with neighbors/building management, 3) Open carrier investigation, 4) Process replacement with expedited shipping. Consider keeping original if found as goodwill gesture.';
    }

    // Defective products
    if (lowerMessage.includes('defect') || lowerMessage.includes('broken') || lowerMessage.includes('not working')) {
      return 'For defective products: Immediately process replacement with expedited shipping. Include prepaid return label for defective item. Add account credit ($10-25) for inconvenience. No troubleshooting needed if clearly defective.';
    }

    // Draft response request
    if (lowerMessage.includes('draft') || lowerMessage.includes('write response') || lowerMessage.includes('help respond')) {
      if (ticketContext) {
        return ticketContext.goldStandard.responseTemplate;
      }
      return 'I can help draft a response. Please let me know which ticket you\'d like me to help with.';
    }

    // Default response
    return 'I can help you with policies (returns, shipping), technical issues (login, payment errors), billing questions, and product recommendations. What specific information do you need?';
  },

  // Generate chat history for testing
  generateInitialChatMessage(): ChatMessage {
    return {
      id: 'initial',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with knowledge base questions, policy information, and drafting customer responses. How can I assist you?',
      timestamp: Date.now(),
    };
  },
};
