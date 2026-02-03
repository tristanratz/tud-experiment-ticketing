'use client';

import { useState, useEffect, useMemo } from 'react';
import { TicketWithStatus, AIAgentStep, TicketResponse } from '@/types';
import { aiMockService } from '@/lib/aiMock';
import CustomerDetailsHover from '@/components/experiment/CustomerDetailsHover';
import { tracking } from '@/lib/tracking';
import { buildDecisionPath, getTreeNode, pruneSelectionsToPath } from '@/lib/decisionTree';

interface AIAgentConfirmProps {
  ticket: TicketWithStatus;
  onComplete: (response: TicketResponse) => void;
  onBack: () => void;
}

export default function AIAgentConfirm({ ticket, onComplete, onBack }: AIAgentConfirmProps) {
  const [steps, setSteps] = useState<AIAgentStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [editValue, setEditValue] = useState('');
  const [editError, setEditError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [customerResponse, setCustomerResponse] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const generatedSteps = aiMockService.generateAgentSteps(ticket);
    const draft = aiMockService.generateCompleteResponse(ticket);
    setSteps(generatedSteps);
    setCustomerResponse(draft);
    setFieldValues({ customerResponse: draft });
    setErrors([]);
    setEditError('');
  }, [ticket]);

  const currentStep = steps[currentStepIndex];

  const decisionSelections = useMemo(() => {
    const selections: Record<string, string> = {};
    steps.forEach(step => {
      if (step.stepType === 'decision' && step.decisionNodeId && step.decisionOptionId) {
        selections[step.decisionNodeId] = step.decisionOptionId;
      }
    });
    return pruneSelectionsToPath(selections);
  }, [steps]);

  const { nodes, outcomeId } = buildDecisionPath(decisionSelections);
  const decisionNodes = nodes.filter(node => node.type === 'decision');
  const outcomeNode = outcomeId ? getTreeNode(outcomeId) : undefined;

  useEffect(() => {
    if (!outcomeNode || outcomeNode.type !== 'outcome') return;
    const allowedFieldIds = new Set((outcomeNode.fields || []).map(field => field.id));
    setFieldValues(prev => {
      const next: Record<string, string | boolean> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (allowedFieldIds.has(key)) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [outcomeNode]);

  useEffect(() => {
    if (!currentStep || isEditing) return;
    if (currentStep.stepType !== 'decision') return;
    if (currentStep.status !== 'rejected') return;
    setEditValue('');
    setEditError('Please select your own decision to proceed.');
    setIsEditing(true);
  }, [currentStep, isEditing]);

  const decisionStepsComplete = steps
    .filter(step => step.stepType === 'decision')
    .every(step => step.status !== 'pending' && step.status !== 'rejected');

  useEffect(() => {
    if (!decisionStepsComplete) return;
    const responseIndex = steps.findIndex(step => step.stepType === 'response');
    if (responseIndex === -1) return;
    if (steps[responseIndex].status !== 'pending') return;
    const updatedSteps = [...steps];
    updatedSteps[responseIndex] = {
      ...updatedSteps[responseIndex],
      status: 'accepted',
    };
    setSteps(updatedSteps);
  }, [decisionStepsComplete, steps]);

  const handleAccept = () => {
    if (currentStep.stepType === 'decision' && currentStep.status === 'rejected') {
      setEditValue('');
      setEditError('Please select your own decision to proceed.');
      setIsEditing(true);
      return;
    }
    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex].status = 'accepted';
    setSteps(updatedSteps);

    tracking.aiStepAccepted(ticket.id, currentStep.stepNumber, currentStep.stepName);

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleReject = () => {
    const updatedSteps = [...steps];
    updatedSteps[currentStepIndex].status = 'rejected';
    setSteps(updatedSteps);

    tracking.aiStepRejected(ticket.id, currentStep.stepNumber, currentStep.stepName);

    if (currentStep.stepType === 'decision') {
      setEditValue('');
      setEditError('Please select your own decision to proceed.');
      setIsEditing(true);
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditError('');
    if (currentStep.stepType === 'decision' && currentStep.decisionOptionId) {
      setEditValue(currentStep.decisionOptionId);
    } else {
      setEditValue(currentStep.decision);
    }
  };

  const handleSaveEdit = () => {
    const updatedSteps = [...steps];
    const targetStep = updatedSteps[currentStepIndex];

    if (targetStep.stepType === 'decision' && targetStep.decisionNodeId) {
      if (!editValue) {
        setEditError('Please select a decision before saving.');
        return;
      }
      const node = getTreeNode(targetStep.decisionNodeId);
      const option = node?.options?.find(opt => opt.id === editValue);
      targetStep.decision = option?.label || editValue;
      targetStep.decisionOptionId = editValue;
    } else {
      targetStep.decision = editValue;
    }

    targetStep.status = 'edited';
    setSteps(updatedSteps);

    tracking.aiStepEdited(ticket.id, targetStep.stepNumber, targetStep.stepName, editValue);

    setIsEditing(false);
    setEditError('');

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    if (fieldId === 'customerResponse' && typeof value === 'string') {
      setCustomerResponse(value);
    }
    setErrors([]);
  };

  const handleComplete = () => {
    const validationErrors: string[] = [];

    if (!outcomeId) {
      validationErrors.push('Please complete all decision steps.');
    }

    const requiredFields = outcomeNode?.type === 'outcome' ? outcomeNode.fields || [] : [];
    requiredFields.forEach(field => {
      if (!field.required) return;
      const value = fieldValues[field.id];
      if (field.type === 'checkbox') {
        if (value !== true) validationErrors.push(`${field.label} is required`);
      } else if (typeof value !== 'string' || value.trim() === '') {
        validationErrors.push(`${field.label} is required`);
      }
    });

    const finalCustomerResponse = typeof fieldValues.customerResponse === 'string'
      ? fieldValues.customerResponse
      : customerResponse;

    if (!finalCustomerResponse.trim()) {
      validationErrors.push('Customer response is required');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const completedAt = Date.now();
    const timeToComplete = completedAt - (ticket.startedAt || completedAt);

    const decisions = decisionNodes.map(node => {
      const optionId = decisionSelections[node.id];
      const optionLabel = node.options?.find(opt => opt.id === optionId)?.label;
      return { nodeId: node.id, optionId, optionLabel };
    }).filter(decision => decision.optionId);

    const response: TicketResponse = {
      ticketId: ticket.id,
      decisions,
      outcomeId: outcomeId || '',
      fields: fieldValues,
      customerResponse: finalCustomerResponse,
      completedAt,
      timeToComplete,
    };

    tracking.customerResponseSent(ticket.id, finalCustomerResponse, completedAt);
    tracking.ticketClosed(ticket.id, completedAt, timeToComplete);

    onComplete(response);
  };

  const allStepsProcessed = steps.every(step => {
    if (step.status === 'pending') return false;
    if (step.stepType === 'decision' && step.status === 'rejected') return false;
    return true;
  });
  const processedStepsCount = steps.filter(step => {
    if (step.status === 'pending') return false;
    if (step.stepType === 'decision' && step.status === 'rejected') return false;
    return true;
  }).length;
  const progress = steps.length > 0 ? (processedStepsCount / steps.length) * 100 : 0;
  const showCurrentStep = currentStep && !isEditing && !decisionStepsComplete;
  const visibleSteps = decisionStepsComplete
    ? steps.filter(step => step.stepType !== 'response')
    : steps;
  const highlightIndex = decisionStepsComplete
    ? Math.min(currentStepIndex, Math.max(visibleSteps.length - 1, 0))
    : currentStepIndex;

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
          {visibleSteps.map((step, index) => (
            <div
              key={step.stepNumber}
              className={`text-center py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                index === highlightIndex
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
        {showCurrentStep && (
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
                {currentStep.stepType === 'response' ? customerResponse : currentStep.decision}
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

            {currentStep.stepType === 'decision' && currentStep.decisionNodeId ? (
              <select
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  setEditError('');
                }}
                title="Edit the AI's decision for this step"
                className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 mb-4"
              >
                <option value="">Select...</option>
                {getTreeNode(currentStep.decisionNodeId)?.options?.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  setEditError('');
                }}
                title="Edit the AI's decision for this step"
                className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 mb-4"
              />
            )}

            {editError && (
              <div className="text-sm text-red-700 mb-3">
                {editError}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditError('');
                }}
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

            {errors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded mb-4">
                <h3 className="text-red-800 font-semibold">Please complete all required fields:</h3>
                <ul className="mt-2 text-red-700 text-sm list-disc list-inside">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3 mb-6">
              {visibleSteps.map((step) => (
                <div
                  key={step.stepNumber}
                  className={`ai-step-card p-3 rounded-lg border-2 ${step.status}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{step.stepName}</div>
                      <div className="text-sm text-gray-700">
                        Decision: {step.stepType === 'response' ? customerResponse : step.decision}
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase">
                      {step.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {outcomeNode?.type === 'outcome' && (
              <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">{outcomeNode.title || 'Action Fields'}:</h4>
                <div className="space-y-4">
                  {(outcomeNode.fields || []).filter(field => field.id !== 'customerResponse').map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' && (
                        <textarea
                          value={typeof fieldValues[field.id] === 'string' ? (fieldValues[field.id] as string) : ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          rows={4}
                          title={field.label}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      )}
                      {field.type === 'checkbox' && (
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={fieldValues[field.id] === true}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-600">{field.label}</span>
                        </div>
                      )}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={typeof fieldValues[field.id] === 'string' ? (fieldValues[field.id] as string) : ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          title={field.label}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      )}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={typeof fieldValues[field.id] === 'string' ? (fieldValues[field.id] as string) : ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          title={field.label}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Customer Response:</h4>
              <textarea
                value={customerResponse}
                onChange={(e) => handleFieldChange('customerResponse', e.target.value)}
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
