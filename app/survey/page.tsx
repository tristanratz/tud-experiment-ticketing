'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { tracking, trackPagePerformance } from '@/lib/tracking';
import { ticketService } from '@/lib/tickets';
import SurveyForm from '@/components/survey/SurveyForm';
import { SurveyResponse } from '@/types';

export default function SurveyPage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any>(null);

  useEffect(() => {
    const session = storage.getSession();
    if (!session) {
      router.push('/');
      return;
    }

    setParticipantId(session.participantId);

    if (typeof window !== 'undefined' && window.location.search) {
      router.replace(window.location.pathname);
    }

    // Calculate performance metrics
    const metrics = ticketService.calculatePerformanceMetrics(session.ticketResponses);
    setPerformanceData(metrics);

    // Track page view
    tracking.pageViewed('survey', 'experiment');

    // Track page performance
    trackPagePerformance('survey');

    setLoading(false);
  }, [router]);

  const handleSubmit = async (response: SurveyResponse) => {
    try {
      // Track survey completion
      tracking.surveyCompleted(response);

      // Send to API
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });

      // Track survey submission (after successful API request)
      tracking.surveySubmitted(response);

      // Final data sync
      const traceBuffer = storage.getTraceBuffer();
      if (traceBuffer.length > 0) {
        try {
          const syncResponse = await fetch('/api/trace-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId: response.participantId,
              events: traceBuffer,
            }),
          });

          if (syncResponse.ok) {
            tracking.dataSynced(traceBuffer.length, 'final');
            storage.clearTraceBuffer();
          } else {
            throw new Error(`Final sync failed with status: ${syncResponse.status}`);
          }
        } catch (syncError) {
          const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';
          tracking.dataSyncFailed(errorMessage, traceBuffer.length);
          console.error('Failed final data sync:', syncError);
          // Don't block navigation on final sync failure
        }
      }

      // Navigate to completion page
      router.push('/complete');
    } catch (error) {
      console.error('Failed to submit survey:', error);
      tracking.applicationError(
        'Survey submission failed',
        error instanceof Error ? error.stack : undefined,
        { participantId: response.participantId }
      );
      alert('There was an error submitting your survey. Please try again.');
    }
  };

  if (loading || !participantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Experiment Complete!
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Thank you for completing the ticket processing task. Before you finish, please answer
            a few questions about your experience.
          </p>

          {/* Performance Summary */}
          {performanceData && performanceData.totalTickets > 0 && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <h3 className="font-semibold text-indigo-900 mb-2">Your Performance</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-indigo-700">Tickets Completed:</span>
                  <span className="font-semibold text-indigo-900 ml-2">
                    {performanceData.totalTickets}
                  </span>
                </div>
                <div>
                  <span className="text-indigo-700">Average Quality Score:</span>
                  <span className="font-semibold text-indigo-900 ml-2">
                    {Math.round(performanceData.averageQualityScore)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Survey Form */}
        <div>
          <SurveyForm participantId={participantId} onSubmit={handleSubmit} />
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>All responses are anonymous and will only be used for research purposes.</p>
        </div>
      </div>
    </div>
  );
}
