'use client';

import { TicketWithStatus, TicketResponse } from '@/types';
import { useState, useEffect } from 'react';
import { tracking } from '@/lib/tracking';
import CustomerDetailsHover from '@/components/experiment/CustomerDetailsHover';

interface TicketDetailProps {
  ticket: TicketWithStatus;
  onComplete: (response: TicketResponse) => void;
  onBack: () => void;
}

export default function TicketDetail({ ticket, onComplete, onBack }: TicketDetailProps) {
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [assignment, setAssignment] = useState('');
  const [customerResponse, setCustomerResponse] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [lastDecisionTime, setLastDecisionTime] = useState<number>(Date.now());

  useEffect(() => {
    // Track ticket opened
    if (ticket.status === 'available') {
      tracking.ticketOpened(ticket.id, Date.now());
    }
  }, [ticket.id, ticket.status]);

  const handleDecisionChange = (
    decisionType: 'priority' | 'category' | 'assignment',
    value: string
  ) => {
    const now = Date.now();
    const timeSinceLastDecision = now - lastDecisionTime;

    // Track decision
    tracking.decisionMade({
      ticketId: ticket.id,
      decisionType,
      value,
      timestamp: now,
      timeSinceLastDecision,
    });

    setLastDecisionTime(now);

    // Update state
    if (decisionType === 'priority') setPriority(value);
    else if (decisionType === 'category') setCategory(value);
    else if (decisionType === 'assignment') setAssignment(value);

    // Clear errors
    setErrors([]);
  };

  const handleComplete = () => {
    const validationErrors: string[] = [];

    if (!priority) validationErrors.push('Priority is required');
    if (!category) validationErrors.push('Category is required');
    if (!assignment) validationErrors.push('Assignment is required');
    if (!customerResponse.trim()) validationErrors.push('Customer response is required');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const completedAt = Date.now();
    const timeToComplete = completedAt - (ticket.startedAt || completedAt);

    // Track customer response
    tracking.customerResponseSent(ticket.id, customerResponse, completedAt);

    // Track ticket closed
    tracking.ticketClosed(ticket.id, completedAt, timeToComplete);

    // Create response object
    const response: TicketResponse = {
      ticketId: ticket.id,
      priority,
      category,
      assignment,
      customerResponse,
      completedAt,
      timeToComplete,
    };

    onComplete(response);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{ticket.id}: {ticket.subject}</h2>
            <div className="text-indigo-100 text-sm mt-1">
              <CustomerDetailsHover ticket={ticket} />
            </div>
          </div>
          <button
            onClick={onBack}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
          >
            ← Back to Queue
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-red-800 font-semibold">Please complete all required fields:</h3>
                <ul className="mt-2 text-red-700 text-sm list-disc list-inside">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Customer Issue */}
        <section className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Customer Issue
          </h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
        </section>

        {/* Decision Points */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Make Decisions</h3>

          <div className="space-y-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => handleDecisionChange('priority', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select priority...</option>
                {ticket.decisionPoints.priority.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleDecisionChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select category...</option>
                {ticket.decisionPoints.category.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign To <span className="text-red-500">*</span>
              </label>
              <select
                value={assignment}
                onChange={(e) => handleDecisionChange('assignment', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select assignment...</option>
                {ticket.decisionPoints.assignment.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Customer Response */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Response to Customer <span className="text-red-500">*</span>
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Write a professional response addressing the customer's issue
          </p>
          <textarea
            value={customerResponse}
            onChange={(e) => setCustomerResponse(e.target.value)}
            placeholder="Type your response to the customer here..."
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
          />
          <div className="text-sm text-gray-500 mt-1">
            {customerResponse.length} characters
          </div>
        </section>

        {/* Complete Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleComplete}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            Complete Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
