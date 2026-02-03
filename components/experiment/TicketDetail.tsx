'use client';

import { TicketWithStatus, TicketResponse } from '@/types';
import { useState, useEffect } from 'react';
import { tracking } from '@/lib/tracking';
import CustomerDetailsHover from '@/components/experiment/CustomerDetailsHover';
import { buildDecisionPath, getTreeNode, pruneSelectionsToPath } from '@/lib/decisionTree';

interface TicketDetailProps {
  ticket: TicketWithStatus;
  onComplete: (response: TicketResponse) => void;
  onBack: () => void;
}

export default function TicketDetail({ ticket, onComplete, onBack }: TicketDetailProps) {
  const [decisionSelections, setDecisionSelections] = useState<Record<string, string>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [lastDecisionTime, setLastDecisionTime] = useState<number>(Date.now());

  useEffect(() => {
    setDecisionSelections({});
    setFieldValues({});
    setErrors([]);
    setLastDecisionTime(Date.now());
  }, [ticket.id]);

  useEffect(() => {
    // Track ticket opened
    if (ticket.status === 'available') {
      tracking.ticketOpened(ticket.id, Date.now());
    }
  }, [ticket.id, ticket.status]);

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
    const now = Date.now();
    const timeSinceLastDecision = now - lastDecisionTime;
    const node = getTreeNode(nodeId);
    const optionLabel = node?.options?.find(opt => opt.id === optionId)?.label || optionId;

    tracking.decisionMade({
      ticketId: ticket.id,
      decisionType: nodeId,
      value: optionLabel,
      timestamp: now,
      timeSinceLastDecision,
    });

    setLastDecisionTime(now);

    setDecisionSelections(prev => {
      const next = { ...prev, [nodeId]: optionId };
      return pruneSelectionsToPath(next);
    });

    setErrors([]);
  };

  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    setErrors([]);
  };

  const handleComplete = () => {
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

    const customerResponse = typeof fieldValues.customerResponse === 'string'
      ? fieldValues.customerResponse
      : '';

    if (!customerResponse.trim()) {
      validationErrors.push('Customer response is required');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const completedAt = Date.now();
    const timeToComplete = completedAt - (ticket.startedAt || completedAt);

    tracking.customerResponseSent(ticket.id, customerResponse, completedAt);
    tracking.ticketClosed(ticket.id, completedAt, timeToComplete);

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

        {/* Decision Tree */}
        <section>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Decision Path</h3>

          <div className="space-y-4">
            {decisionNodes.map((node) => (
              <div key={node.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {node.prompt} <span className="text-red-500">*</span>
                </label>
                <select
                  value={decisionSelections[node.id] || ''}
                  onChange={(e) => handleDecisionChange(node.id, e.target.value)}
                  title={node.prompt}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select...</option>
                  {node.options?.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>

        {/* Outcome Fields */}
        {outcomeNode?.type === 'outcome' && (
          <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {outcomeNode.title || 'Action Fields'}
            </h3>
            <div className="space-y-4">
              {(outcomeNode.fields || []).map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' && (
                    <textarea
                      value={typeof fieldValues[field.id] === 'string' ? (fieldValues[field.id] as string) : ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      title={field.label}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
                    />
                  )}
                  {field.type === 'checkbox' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={fieldValues[field.id] === true}
                        onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600">{field.label}</span>
                    </div>
                  )}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={typeof fieldValues[field.id] === 'string' ? (fieldValues[field.id] as string) : ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      title={field.label}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  )}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={typeof fieldValues[field.id] === 'string' ? (fieldValues[field.id] as string) : ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      title={field.label}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  )}
                  {field.helperText && (
                    <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>
                  )}
                  {field.id === 'customerResponse' && typeof fieldValues[field.id] === 'string' && (
                    <div className="text-sm text-gray-500 mt-1">
                      {(fieldValues[field.id] as string).length} characters
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

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
