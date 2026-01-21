'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { ticketService } from '@/lib/tickets';
import { tracking, useMouseTracking } from '@/lib/tracking';
import { TicketWithStatus, TicketResponse, SessionData } from '@/types';
import ProcessBar from '@/components/experiment/ProcessBar';
import TicketOverview from '@/components/experiment/TicketOverview';
import TicketDetail from '@/components/experiment/TicketDetail';
import KnowledgeBase from '@/components/experiment/KnowledgeBase';
import ChatAssistant from '@/components/experiment/ChatAssistant';
import AIAgentConfirm from '@/components/experiment/AIAgentConfirm';
import AIAgentAuto from '@/components/experiment/AIAgentAuto';

const EXPERIMENT_DURATION = 15 * 60; // 15 minutes in seconds

export default function ExperimentPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [tickets, setTickets] = useState<TicketWithStatus[]>([]);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(EXPERIMENT_DURATION);
  const [loading, setLoading] = useState(true);

  // Initialize experiment
  useEffect(() => {
    const sessionData = storage.getSession();

    if (!sessionData) {
      router.push('/');
      return;
    }

    setSession(sessionData);

    // Initialize tickets
    const initialTickets = ticketService.initializeTicketsWithStatus(
      sessionData.timingMode,
      sessionData.startTime
    );
    setTickets(initialTickets);

    // Calculate initial time remaining
    const elapsed = Math.floor((Date.now() - sessionData.startTime) / 1000);
    const remaining = Math.max(0, EXPERIMENT_DURATION - elapsed);
    setTimeRemaining(remaining);

    setLoading(false);
  }, [router]);

  // Timer countdown
  useEffect(() => {
    if (!session || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          // Time's up - redirect to survey
          clearInterval(interval);
          router.push('/survey');
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, timeRemaining, router]);

  // Check for tickets to unlock (staggered mode)
  useEffect(() => {
    if (!session || session.timingMode !== 'staggered') return;

    const interval = setInterval(() => {
      setTickets((prevTickets) => {
        const updatedTickets = ticketService.checkUnlockTickets(
          prevTickets,
          session.startTime
        );
        return updatedTickets;
      });
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [session]);

  // Mouse tracking
  useEffect(() => {
    const cleanup = useMouseTracking();
    return cleanup;
  }, []);

  // Data sync to server (every 30 seconds)
  useEffect(() => {
    if (!session) return;

    const syncInterval = setInterval(async () => {
      const traceBuffer = storage.getTraceBuffer();
      if (traceBuffer.length > 0) {
        try {
          await fetch('/api/trace-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId: session.participantId,
              events: traceBuffer,
            }),
          });
          storage.clearTraceBuffer();
        } catch (error) {
          console.error('Failed to sync trace data:', error);
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(syncInterval);
  }, [session]);

  const handleSelectTicket = (ticketId: string) => {
    setTickets((prevTickets) =>
      ticketService.updateTicketStatus(prevTickets, ticketId, 'in-progress')
    );
    setCurrentTicketId(ticketId);
  };

  const handleCompleteTicket = (response: TicketResponse) => {
    // Save response
    storage.addTicketResponse(response);

    // Update ticket status
    setTickets((prevTickets) =>
      ticketService.updateTicketStatus(prevTickets, response.ticketId, 'completed')
    );

    // Go back to overview
    setCurrentTicketId(null);

    // Check if all tickets completed
    const allCompleted = tickets.every(
      (t) => t.id === response.ticketId || t.status === 'completed' || t.status === 'locked'
    );

    if (allCompleted) {
      // All available tickets completed - go to survey
      setTimeout(() => {
        router.push('/survey');
      }, 1000);
    }
  };

  const handleBackToOverview = () => {
    if (currentTicketId) {
      // Set back to available if it was in-progress
      const ticket = tickets.find((t) => t.id === currentTicketId);
      if (ticket && ticket.status === 'in-progress') {
        setTickets((prevTickets) =>
          ticketService.updateTicketStatus(prevTickets, currentTicketId, 'available')
        );
      }
    }
    setCurrentTicketId(null);
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experiment...</p>
        </div>
      </div>
    );
  }

  const currentTicket = tickets.find((t) => t.id === currentTicketId);

  // Render main content based on group and current state
  const renderMainContent = () => {
    // Groups 3 and 4 use AI agents for ticket processing
    if (currentTicket && (session.group === '3' || session.group === '4')) {
      return session.group === '3' ? (
        <AIAgentConfirm
          ticket={currentTicket}
          onComplete={handleCompleteTicket}
          onBack={handleBackToOverview}
        />
      ) : (
        <AIAgentAuto
          ticket={currentTicket}
          onComplete={handleCompleteTicket}
          onBack={handleBackToOverview}
        />
      );
    }

    // Groups 1 and 2 use standard ticket detail
    if (currentTicket) {
      return (
        <TicketDetail
          ticket={currentTicket}
          onComplete={handleCompleteTicket}
          onBack={handleBackToOverview}
        />
      );
    }

    // Show ticket overview when no ticket selected
    return <TicketOverview tickets={tickets} onSelectTicket={handleSelectTicket} />;
  };

  // Render sidebar based on group
  const renderSidebar = () => {
    if (session.group === '1') {
      return <KnowledgeBase />;
    }

    if (session.group === '2') {
      return <ChatAssistant currentTicket={currentTicket} />;
    }

    // Groups 3 and 4 don't need a sidebar (AI agents are in main content)
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {session.group === '3' ? 'AI Agent Assistant' : 'Autonomous AI Agent'}
        </h3>
        <p className="text-sm text-gray-600">
          {session.group === '3'
            ? 'The AI agent will guide you through each ticket step-by-step. Review and approve each decision.'
            : 'The AI agent will process tickets automatically. Review and approve the complete solution.'}
        </p>
        <div className="mt-4 text-xs text-gray-500">
          Group: {session.group} | Mode: {session.timingMode}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Process Bar */}
      <ProcessBar
        tickets={tickets}
        currentTicketId={currentTicketId}
        timeRemaining={timeRemaining}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Group-specific content */}
          <div className="lg:col-span-1 max-h-[calc(100vh-200px)]">
            {renderSidebar()}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {renderMainContent()}
          </div>
        </div>
      </div>

      {/* Emergency Exit */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to end the experiment early?')) {
              router.push('/survey');
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm shadow-lg"
        >
          End Early
        </button>
      </div>
    </div>
  );
}
