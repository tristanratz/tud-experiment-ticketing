'use client';

import { useState, useEffect } from 'react';
import { TicketWithStatus, AIAgentStep, TicketResponse } from '@/types';
import { aiMockService } from '@/lib/aiMock';
import { tracking } from '@/lib/tracking';

interface AIAgentAutoProps {
  ticket: TicketWithStatus;
  onComplete: (response: TicketResponse) => void;
  onBack: () => void;
}

export default function AIAgentAuto({ ticket, onComplete, onBack }: AIAgentAutoProps) {
  const [steps, setSteps] = useState<AIAgentStep[]>([]);
  const [customerResponse, setCustomerResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [editingDecisions, setEditingDecisions] = useState(false);
  const [editingResponse, setEditingResponse] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate AI processing with delay
    const processSteps = async () => {
      const generatedSteps = aiMockService.generateAgentSteps(ticket);
      const draft = aiMockService.generateCompleteResponse(ticket);

      // Simulate processing each step with animation
      for (let i = 0; i <= generatedSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress((i / generatedSteps.length) * 100);

        if (i < generatedSteps.length) {
          setSteps(prev => [
            ...prev,
            { ...generatedSteps[i], status: 'accepted' }
          ]);
        }
      }

      setCustomerResponse(draft);
      setIsProcessing(false);
    };

    processSteps();
  }, [ticket]);

  const handleApproveAll = () => {
    const priorityStep = steps.find(s => s.stepName === 'Determine Priority');
    const categoryStep = steps.find(s => s.stepName === 'Categorize Issue');
    const assignmentStep = steps.find(s => s.stepName === 'Assign to Team');

    if (!priorityStep || !categoryStep || !assignmentStep) {
      alert('Processing not complete.');
      return;
    }

    const completedAt = Date.now();
    const timeToComplete = completedAt - (ticket.startedAt || completedAt);

    const response: TicketResponse = {
      ticketId: ticket.id,
      priority: priorityStep.decision,
      category: categoryStep.decision,
      assignment: assignmentStep.decision,
      customerResponse,
      completedAt,
      timeToComplete,
    };

    tracking.customerResponseSent(ticket.id, customerResponse, completedAt);
    tracking.ticketClosed(ticket.id, completedAt, timeToComplete);

    onComplete(response);
  };

  const getDecisionValue = (stepName: string): string => {
    const step = steps.find(s => s.stepName === stepName);
    return step?.decision || '';
  };

  const updateDecisionValue = (stepName: string, newValue: string) => {
    setSteps(prev => prev.map(step =>
      step.stepName === stepName
        ? { ...step, decision: newValue, status: 'edited' as const }
        : step
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Autonomous AI Agent</h2>
            <p className="text-emerald-100 text-sm mt-1">
              {ticket.id}: {ticket.subject}
            </p>
          </div>
          <button
            onClick={onBack}
            className="bg-white text-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Processing Animation */}
        {isProcessing && (
          <div className="border-2 border-emerald-200 rounded-lg p-8 bg-emerald-50 text-center">
            <div className="spinner mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-emerald-900 mb-2">
              AI is processing your ticket...
            </h3>
            <p className="text-emerald-700 text-sm mb-4">
              Analyzing issue, making decisions, and drafting response
            </p>
            <div className="bg-emerald-200 rounded-full h-2 max-w-md mx-auto">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {!isProcessing && (
          <>
            {/* Customer Issue Context */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Customer Issue:</h3>
              <p className="text-gray-700 text-sm">{ticket.description}</p>
            </div>

            {/* AI Decisions */}
            <div className="border-2 border-emerald-200 rounded-lg p-6 bg-emerald-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-emerald-900">
                  AI Decisions Summary
                </h3>
                {!editingDecisions && (
                  <button
                    onClick={() => setEditingDecisions(true)}
                    className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 transition-colors"
                  >
                    Edit Decisions
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Priority */}
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  {editingDecisions ? (
                    <select
                      value={getDecisionValue('Determine Priority')}
                      onChange={(e) => updateDecisionValue('Determine Priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      {ticket.decisionPoints.priority.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-lg font-semibold text-gray-900">
                      {getDecisionValue('Determine Priority')}
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Category
                  </label>
                  {editingDecisions ? (
                    <select
                      value={getDecisionValue('Categorize Issue')}
                      onChange={(e) => updateDecisionValue('Categorize Issue', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      {ticket.decisionPoints.category.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-lg font-semibold text-gray-900">
                      {getDecisionValue('Categorize Issue')}
                    </div>
                  )}
                </div>

                {/* Assignment */}
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  {editingDecisions ? (
                    <select
                      value={getDecisionValue('Assign to Team')}
                      onChange={(e) => updateDecisionValue('Assign to Team', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                      {ticket.decisionPoints.assignment.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-lg font-semibold text-gray-900">
                      {getDecisionValue('Assign to Team')}
                    </div>
                  )}
                </div>
              </div>

              {editingDecisions && (
                <button
                  onClick={() => setEditingDecisions(false)}
                  className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors w-full font-semibold"
                >
                  Save Changes
                </button>
              )}
            </div>

            {/* Customer Response */}
            <div className="border-2 border-emerald-200 rounded-lg p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Draft Customer Response
                </h3>
                {!editingResponse && (
                  <button
                    onClick={() => setEditingResponse(true)}
                    className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 transition-colors"
                  >
                    Edit Response
                  </button>
                )}
              </div>

              {editingResponse ? (
                <>
                  <textarea
                    value={customerResponse}
                    onChange={(e) => setCustomerResponse(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-sans text-sm"
                  />
                  <button
                    onClick={() => setEditingResponse(false)}
                    className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors w-full font-semibold"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {customerResponse}
                  </p>
                </div>
              )}
            </div>

            {/* Approve Button */}
            <div className="flex space-x-4">
              <button
                onClick={handleApproveAll}
                className="flex-1 bg-emerald-600 text-white px-6 py-4 rounded-lg hover:bg-emerald-700 transition-colors font-bold text-lg shadow-lg"
              >
                ✓ Approve All & Complete Ticket
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
