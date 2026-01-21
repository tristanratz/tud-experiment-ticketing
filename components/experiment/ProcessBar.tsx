'use client';

import { TicketWithStatus } from '@/types';
import { useEffect, useState } from 'react';

interface ProcessBarProps {
  tickets: TicketWithStatus[];
  currentTicketId: string | null;
  timeRemaining: number; // seconds
}

export default function ProcessBar({ tickets, currentTicketId, timeRemaining }: ProcessBarProps) {
  const completedCount = tickets.filter(t => t.status === 'completed').length;
  const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
  const totalTickets = tickets.length;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const getTimerColor = () => {
    if (timeRemaining > 300) return 'text-green-600'; // > 5 min
    if (timeRemaining > 120) return 'text-yellow-600'; // > 2 min
    return 'text-red-600 timer-critical'; // < 2 min
  };

  const currentTicket = tickets.find(t => t.id === currentTicketId);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Progress Info */}
          <div className="flex items-center space-x-6">
            <div>
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-xl font-bold text-gray-800">
                {completedCount} / {totalTickets} Tickets
              </div>
            </div>

            {inProgressCount > 0 && (
              <div className="border-l border-gray-300 pl-6">
                <div className="text-sm text-gray-500">In Progress</div>
                <div className="text-lg font-semibold text-indigo-600">
                  {inProgressCount} {inProgressCount === 1 ? 'Ticket' : 'Tickets'}
                </div>
              </div>
            )}
          </div>

          {/* Current Ticket Info */}
          {currentTicket && (
            <div className="flex-1 max-w-md">
              <div className="text-sm text-gray-500 mb-1">Current Ticket</div>
              <div className="bg-indigo-50 rounded-lg px-4 py-2 border border-indigo-200">
                <div className="text-sm font-semibold text-indigo-900">
                  {currentTicket.id}: {currentTicket.subject}
                </div>
                <div className="text-xs text-indigo-700 mt-1">
                  Customer: {currentTicket.customer}
                </div>
              </div>
            </div>
          )}

          {/* Timer */}
          <div className="text-right">
            <div className="text-sm text-gray-500">Time Remaining</div>
            <div className={`text-3xl font-bold tabular-nums ${getTimerColor()}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${(completedCount / totalTickets) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {Math.round((completedCount / totalTickets) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
