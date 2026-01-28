'use client';

import { TicketWithStatus } from '@/types';
import CustomerDetailsHover from '@/components/experiment/CustomerDetailsHover';

interface TicketOverviewProps {
  tickets: TicketWithStatus[];
  onSelectTicket: (ticketId: string) => void;
}

export default function TicketOverview({ tickets, onSelectTicket }: TicketOverviewProps) {
  // Filter out locked tickets - only show available, in-progress, and completed
  const visibleTickets = tickets.filter(ticket => ticket.status !== 'locked');

  const getStatusBadge = (status: TicketWithStatus['status']) => {
    const badges = {
      locked: 'bg-gray-200 text-gray-600',
      available: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
    };
    const labels = {
      locked: 'Locked',
      available: 'Available',
      'in-progress': 'In Progress',
      completed: 'Completed',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPriorityIndicator = (description: string) => {
    // Simple heuristic based on keywords
    const urgent = description.toLowerCase().includes('urgent') ||
                   description.toLowerCase().includes('asap') ||
                   description.toLowerCase().includes('immediately');
    if (urgent) return <span className="text-red-500 text-xl">!</span>;
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800">Ticket Queue</h2>
        <p className="text-sm text-gray-600 mt-1">
          Select a ticket to start working on it
        </p>
      </div>

      <div className="divide-y divide-gray-200 flex-1 overflow-y-auto">
        {visibleTickets.length > 0 ? (
          visibleTickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => ticket.status !== 'locked' && ticket.status !== 'completed' && onSelectTicket(ticket.id)}
            className={`ticket-card p-6 ${
              ticket.status === 'locked'
                ? 'bg-gray-50 cursor-not-allowed opacity-60'
                : ticket.status === 'completed'
                ? 'bg-green-50 opacity-75'
                : 'cursor-pointer hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-gray-700">{ticket.id}</span>
                {getPriorityIndicator(ticket.description)}
                {getStatusBadge(ticket.status)}
              </div>
              {ticket.status === 'locked' && (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {ticket.status === 'completed' && (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <h3 className="font-semibold text-gray-800 mb-1">{ticket.subject}</h3>

            <div className="text-sm text-gray-600 mb-2">
              <CustomerDetailsHover
                ticket={ticket}
                labelClassName="text-sm text-gray-600"
                nameClassName="font-medium text-gray-800"
                emailClassName="text-gray-500"
                iconClassName="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500"
              />
            </div>

            <p className="text-sm text-gray-700 line-clamp-2">
              {ticket.description}
            </p>

            {ticket.status === 'locked' && (
              <div className="mt-3 text-xs text-gray-500 italic">
                This ticket will unlock shortly...
              </div>
            )}
          </div>
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Tickets Available Yet</h3>
            <p className="text-sm text-gray-500">New tickets will appear shortly. Please wait...</p>
          </div>
        )}
      </div>
    </div>
  );
}
