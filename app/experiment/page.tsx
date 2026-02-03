'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLockout from '@/components/MobileLockout';
import { isLikelyMobile } from '@/lib/device';
import { storage } from '@/lib/storage';
import { ticketService } from '@/lib/tickets';
import { tracking, setupMouseTracking, setupGlobalTracking, trackPagePerformance } from '@/lib/tracking';
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
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'knowledge' | 'assistant'>('assistant');
  const lastRemainingRef = useRef<number | null>(null);
  const expiredRef = useRef(false);
  const ticketsRef = useRef<TicketWithStatus[]>([]);

  const calculateRemaining = (startTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, EXPERIMENT_DURATION - elapsed);
  };

  // Initialize experiment
  useEffect(() => {
    const mobile = isLikelyMobile();
    setIsMobile(mobile);
    if (mobile) {
      setLoading(false);
      return;
    }

    const sessionData = storage.getSession();

    if (!sessionData) {
      router.push('/');
      return;
    }

    if (typeof window !== 'undefined' && window.location.search) {
      router.replace(window.location.pathname);
    }

    setSession(sessionData);
    if (sessionData.group !== '1') {
      setSidebarTab('assistant');
    }

    // Initialize tickets
    const initialTickets = ticketService.initializeTicketsWithStatus(
      sessionData.timingMode,
      sessionData.startTime
    );
    setTickets(initialTickets);

    // Calculate initial time remaining
    const remaining = calculateRemaining(sessionData.startTime);
    setTimeRemaining(remaining);

    // Track page view
    tracking.pageViewed('experiment', 'home');

    // Track page performance
    trackPagePerformance('experiment');

    setLoading(false);
  }, [router]);

  // Timer countdown with warnings
  useEffect(() => {
    ticketsRef.current = tickets;
  }, [tickets]);

  // Timer countdown with warnings
  useEffect(() => {
    if (!session) return;

    expiredRef.current = false;
    lastRemainingRef.current = null;

    const handleExpire = () => {
      if (expiredRef.current) return;
      expiredRef.current = true;
      const completedCount = ticketsRef.current.filter(t => t.status === 'completed').length;
      tracking.experimentTimeExpired(completedCount, ticketsRef.current.length);
      router.push('/survey');
    };

    const maybeTrackWarning = (lastRemaining: number, remaining: number) => {
      if (lastRemaining > 300 && remaining <= 300) {
        tracking.timerWarning(300, '5min');
      } else if (lastRemaining > 120 && remaining <= 120) {
        tracking.timerWarning(120, '2min');
      } else if (lastRemaining > 60 && remaining <= 60) {
        tracking.timerWarning(60, '1min');
      }
    };

    const updateRemaining = () => {
      const remaining = calculateRemaining(session.startTime);
      setTimeRemaining(remaining);

      const lastRemaining = lastRemainingRef.current;
      if (lastRemaining !== null) {
        maybeTrackWarning(lastRemaining, remaining);
      }
      lastRemainingRef.current = remaining;

      if (remaining <= 0) {
        handleExpire();
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    const handleVisibility = () => updateRemaining();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [session, router]);

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
    if (isMobile) return;
    const cleanup = setupMouseTracking();
    return cleanup;
  }, [isMobile]);

  // Global tracking (focus, visibility, errors)
  useEffect(() => {
    if (isMobile) return;
    const cleanup = setupGlobalTracking(currentTicketId || undefined);
    return cleanup;
  }, [currentTicketId, isMobile]);

  // Data sync to server (every 30 seconds)
  useEffect(() => {
    if (isMobile) return;
    if (!session) return;

    const syncInterval = setInterval(async () => {
      const traceBuffer = storage.getTraceBuffer();
      if (traceBuffer.length > 0) {
        try {
          const response = await fetch('/api/trace-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId: session.participantId,
              events: traceBuffer,
            }),
          });

          if (response.ok) {
            tracking.dataSynced(traceBuffer.length, 'auto');
            storage.clearTraceBuffer();
          } else {
            throw new Error(`Sync failed with status: ${response.status}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Failed to sync trace data:', error);
          tracking.dataSyncFailed(errorMessage, traceBuffer.length);
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(syncInterval);
  }, [session, isMobile]);

  const handleSelectTicket = (ticketId: string) => {
    setTickets((prevTickets) =>
      ticketService.updateTicketStatus(prevTickets, ticketId, 'in-progress')
    );
    setCurrentTicketId(ticketId);
    tracking.ticketOpened(ticketId, Date.now());
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

    // Check if all AVAILABLE tickets are completed (exclude locked tickets)
    // Don't finish if there are still locked tickets that will appear later
    const hasLockedTickets = tickets.some((t) => t.status === 'locked');
    const allAvailableCompleted = tickets.every(
      (t) => t.id === response.ticketId || t.status === 'completed' || t.status === 'locked'
    );

    // Only finish if all available tickets are done AND no locked tickets remain
    if (allAvailableCompleted && !hasLockedTickets) {
      // All tickets completed - go to survey
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

  if (isMobile) {
    return <MobileLockout />;
  }

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

    const tabs = [
      { id: 'knowledge', label: 'Knowledge Base' },
      { id: 'assistant', label: 'AI Assistant' },
    ] as const;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                sidebarTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-hidden">
          {sidebarTab === 'knowledge' ? (
            <KnowledgeBase variant="embedded" />
          ) : (
            <ChatAssistant currentTicket={currentTicket} variant="embedded" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* Process Bar - Fixed height */}
      <div className="flex-shrink-0">
        <ProcessBar
          tickets={tickets}
          currentTicketId={currentTicketId}
          timeRemaining={timeRemaining}
        />
      </div>

      {/* Main Content - Scrollable area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Sidebar - Group-specific content */}
            <div className="lg:col-span-1 h-full overflow-hidden">
              {renderSidebar()}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 h-full overflow-hidden">
              {renderMainContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Exit */}
      <div className="fixed bottom-4 right-4 z-50">
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
