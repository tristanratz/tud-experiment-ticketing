'use client';

import { useState, useEffect } from 'react';
import { TicketWithStatus, AIAgentStep, TicketResponse } from '@/types';
import { aiMockService } from '@/lib/aiMock';
import CustomerDetailsHover from '@/components/experiment/CustomerDetailsHover';
import { tracking } from '@/lib/tracking';

interface AIAgentConfirmProps {
  ticket: TicketWithStatus;
  onComplete: (response: TicketResponse) => void;
  onBack: () => void;
}

export default function AIAgentConfirm({ ticket, onComplete, onBack }: AIAgentConfirmProps) {
  const [steps, setSteps] = useState<AIAgentStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [customerResponse, setCustomerResponse] = useState('');

  useEffect(() => {
    // Generate AI agent steps for this ticket
    const generatedSteps = aiMockService.generateAgentSteps(ticket);
    setSteps(generatedSteps);
    setCustomerResponse(aiMockService.generateCompleteResponse(ticket));
  }, [ticket]);

  const currentStep = steps[currentStepIndex];

  const handleAccept = () => {
    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex].status = 'accepted';
    setSteps(updatedSteps);

    tracking.aiStepAccepted(ticket.id, currentStep.stepNumber, currentStep.stepName);

    // Move to next step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleReject = () => {
    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex].status = 'rejected';
    setSteps(updatedSteps);

    tracking.aiStepRejected(ticket.id, currentStep.stepNumber, currentStep.stepName);

    // Move to next step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(currentStep.decision);
  };

  const handleSaveEdit = () => {
    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex].decision = editValue;
    updatedSteps[currentStepIndex].status = 'edited';
    setSteps(updatedSteps);

    tracking.aiStepEdited(ticket.id, currentStep.stepNumber, currentStep.stepName, editValue);

    setIsEditing(false);

    // Move to next step
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleComplete = () => {
    // Extract decisions from steps
    const priorityStep = steps.find(s => s.stepName === 'Determine Priority');
    const categoryStep = steps.find(s => s.stepName === 'Categorize Issue');
    const assignmentStep = steps.find(s => s.stepName === 'Assign to Team');

    if (!priorityStep || !categoryStep || !assignmentStep) {
      alert('Please complete all decision steps.');
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

  const allStepsProcessed = steps.every(s => s.status !== 'pending');
  const progress = (steps.filter(s => s.status !== 'pending').length / steps.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">AI Agent Processing</h2>
            <p className="text-purple-100 text-sm mt-1">
              {ticket.id}: {ticket.subject}
            </p>
            <div className="text-purple-100 text-sm mt-1">
              <CustomerDetailsHover
                ticket={ticket}
                labelClassName="text-sm text-purple-100"
                emailClassName="text-purple-200"
                iconClassName="inline-flex h-5 w-5 items-center justify-center rounded-full border border-purple-200 text-xs text-purple-100"
              />
            </div>
          </div>
          <button
            onClick={onBack}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors font-medium"
          >
            ← Back
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="bg-purple-800 rounded-full h-2">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Steps Overview */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step, index) => (
            <div
              key={step.stepNumber}
              className={`text-center py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                index === currentStepIndex
                  ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                  : step.status === 'accepted'
                  ? 'bg-green-100 text-green-800'
                  : step.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : step.status === 'edited'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Step {step.stepNumber}
            </div>
          ))}
        </div>

        {/* Current Step */}
        {currentStep && !isEditing && (
          <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-purple-900">
                  Step {currentStep.stepNumber}: {currentStep.stepName}
                </h3>
                <p className="text-sm text-purple-700 mt-1">{currentStep.reasoning}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-gray-600 mb-2">AI Decision:</div>
              <div className="text-lg font-semibold text-gray-900">
                {currentStep.decision}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAccept}
                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                ✓ Accept
              </button>
              <button
                onClick={handleEdit}
                className="flex-1 bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
              >
                ✎ Edit
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                ✕ Reject
              </button>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {currentStep && isEditing && (
          <div className="border-2 border-yellow-300 rounded-lg p-6 bg-yellow-50">
            <h3 className="text-lg font-bold text-yellow-900 mb-4">
              Edit Step {currentStep.stepNumber}: {currentStep.stepName}
            </h3>

            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              title="Edit the AI's decision for this step"
              className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 mb-4"
            />

            <div className="flex space-x-3">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Completed Steps Summary */}
        {allStepsProcessed && (
          <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
            <h3 className="text-lg font-bold text-green-900 mb-4">
              All Steps Processed - Review & Complete
            </h3>

            <div className="space-y-3 mb-6">
              {steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className={`ai-step-card p-3 rounded-lg border-2 ${step.status}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{step.stepName}</div>
                      <div className="text-sm text-gray-700">Decision: {step.decision}</div>
                    </div>
                    <span className="text-xs font-bold uppercase">
                      {step.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Customer Response:</h4>
              <textarea
                value={customerResponse}
                onChange={(e) => setCustomerResponse(e.target.value)}
                rows={6}
                title="Review and edit the customer response before completing"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>

            <button
              onClick={handleComplete}
              className="w-full bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-bold text-lg shadow-lg"
            >
              Complete Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
