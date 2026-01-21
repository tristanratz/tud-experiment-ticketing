# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based experimental platform for a research study on ticket system interfaces with different AI support levels. Participants process customer support tickets under timed conditions (15 minutes, 10 tickets) while their behavior is tracked.

## Experiment Design

### Four Experimental Groups

1. **Knowledge Base**: Left sidebar with hierarchical, collapsible knowledge base; right side ticket system
2. **Chat**: Left sidebar with AI chat for answering knowledge base questions and drafting customer responses
3. **AI Agents with Confirmation**: Step-by-step AI agent execution with regular participant confirmation (accept/reject/edit decisions)
4. **Autonomous AI Agents**: Fully automated AI agent processing with final approval step only

### Core Features

- **Group Assignment**: Participants arrive via URL with group parameter
- **Ticket System**: Overview page → individual ticket view with dropdowns for decision-making and chat for customer responses
- **Process Tracking Bar**: Always-visible header showing current process step, open decisions, and live progress updates
- **Time Pressure**: Two variants - all tickets visible immediately OR tickets appear on timed schedule to induce stress
- **Post-Experiment Survey**: In-page questionnaire measuring perceived stress, decision confidence, self-efficacy, trust, and engagement
- **Completion Page**: Thank you message, contact details, Prolific confirmation link

## Technical Requirements

### Configuration

- **PostHog**: Analytics/tracking integration (URL via environment variable)
- **Knowledge Base**: Markdown files in dedicated directory structure
- **Tickets**: JSON configuration for ticket data and scenarios

### Digital Trace Data Collection

The system must track:
- Performance metrics: Distance from gold standard ticket outcomes
- Error rates during process execution
- Ticket quality and user satisfaction scores
- Time to first response and time to close per ticket
- Total tickets resolved in 15 minutes
- Mouse clicks and movement velocity
- Customer response text (for semantic analysis)
- Time intervals between decisions within ticket process

## Implementation Considerations

- **Minimal Context Switching**: Participants should remain on same webpage with content/window changes only (no page navigation)
- **Real-time Updates**: Process bar must update live as participants progress
- **Group-Specific Layouts**: Left sidebar content varies by experimental condition, but core ticket system interface remains consistent
- **Accessibility**: Hierarchical knowledge base must support expand/collapse interactions

## Development Workflow

Since this is an early-stage project, establish these foundation components first:
- Web application framework selection and setup
- Database schema for tickets, responses, and trace data
- PostHog integration for event tracking
- Markdown parser for knowledge base rendering
- JSON schema and loader for ticket configuration
- User session management with group assignment from URL parameters
