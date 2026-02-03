'use client';

import { useState, useEffect } from 'react';
import { TicketWithStatus, TicketResponse } from '@/types';
import { aiMockService } from '@/lib/aiMock';
import CustomerDetailsHover from '@/components/experiment/CustomerDetailsHover';
import { tracking } from '@/lib/tracking';
import { buildDecisionPath, getTreeNode, pruneSelectionsToPath } from '@/lib/decisionTree';

interface AIAgentAutoProps {
  ticket: TicketWithStatus;
  onComplete: (response: TicketResponse) => void;
  onBack: () => void;
}

export default function AIAgentAuto({ ticket, onComplete, onBack }: AIAgentAutoProps) {
  const [customerResponse, setCustomerResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [editingDecisions, setEditingDecisions] = useState(false);
  const [editingResponse, setEditingResponse] = useState(false);
  const [progress, setProgress] = useState(0);
  const [decisionSelections, setDecisionSelections] = useState<Record<string, string>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const processSteps = async () => {
      const generatedSteps = aiMockService.generateAgentSteps(ticket);
      const draft = aiMockService.generateCompleteResponse(ticket);
      const outcomeId = ticket.goldStandard.outcomeId;
      const outcomeFields = aiMockService.generateOutcomeFields(ticket, outcomeId);

      const initialSelections = ticket.goldStandard.path.reduce<Record<string, string>>((acc, step) => {
        acc[step.nodeId] = step.optionId;
        return acc;
      }, {});

      // Simulate processing each step with animation
      for (let i = 0; i <= generatedSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProgress((i / generatedSteps.length) * 100);

      }

      setDecisionSelections(pruneSelectionsToPath(initialSelections));
      setCustomerResponse(draft);
      setFieldValues({ customerResponse: draft, ...outcomeFields });
      setIsProcessing(false);
    };

    processSteps();
  }, [ticket]);

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

  const handleDecisionChange = (nodeId: string, optionId: string) => {
    setDecisionSelections(prev => {
      const next = { ...prev, [nodeId]: optionId };
      return pruneSelectionsToPath(next);
    });
    setErrors([]);
  };

  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    if (fieldId === 'customerResponse' && typeof value === 'string') {
      setCustomerResponse(value);
    }
    setErrors([]);
  };

  const handleApproveAll = () => {
    const validationErrors: string[] = [];

    if (!outcomeId) {
      validationErrors.push('Please complete all decision steps');
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

  const getDecisionValue = (nodeId: string): string => decisionSelections[nodeId] || '';

  const getOptionLabel = (nodeId: string): string => {
    const node = getTreeNode(nodeId);
    const option = node?.options?.find(opt => opt.id === decisionSelections[nodeId]);
    return option?.label || '';
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
            <div className="text-emerald-100 text-sm mt-1">
              <CustomerDetailsHover
                ticket={ticket}
                labelClassName="text-sm text-emerald-100"
                emailClassName="text-emerald-200"
                iconClassName="inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-200 text-xs text-emerald-100"
              />
            </div>
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
            {errors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <h3 className="text-red-800 font-semibold">Please complete all required fields:</h3>
                <ul className="mt-2 text-red-700 text-sm list-disc list-inside">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

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
                {decisionNodes.map((node) => (
                  <div key={node.id} className="bg-white rounded-lg p-4 border border-emerald-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {node.prompt}
                    </label>
                    {editingDecisions ? (
                      <select
                        value={getDecisionValue(node.id)}
                        onChange={(e) => handleDecisionChange(node.id, e.target.value)}
                        title={node.prompt}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        {node.options?.map(opt => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">
                        {getOptionLabel(node.id)}
                      </div>
                    )}
                  </div>
                ))}
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

            {/* Action Fields */}
            {outcomeNode?.type === 'outcome' && (
              <div className="border-2 border-emerald-200 rounded-lg p-6 bg-white">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {outcomeNode.title || 'Action Fields'}
                </h3>
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
                          rows={5}
                          title={field.label}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-sans text-sm"
                        />
                      )}
                      {field.type === 'checkbox' && (
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={fieldValues[field.id] === true}
                            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          value={typeof fieldValues[field.id] === 'string' ? (fieldValues[field.id] as string) : ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          title={field.label}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    onChange={(e) => {
                      setCustomerResponse(e.target.value);
                      handleFieldChange('customerResponse', e.target.value);
                    }}
                    rows={8}
                    title="Edit the draft response before approval"
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
