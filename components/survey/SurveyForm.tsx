'use client';

import { useState } from 'react';
import { SurveyResponse } from '@/types';

interface SurveyFormProps {
  participantId: string;
  onSubmit: (response: SurveyResponse) => void;
}

export default function SurveyForm({ participantId, onSubmit }: SurveyFormProps) {
  const [perceivedStress, setPerceivedStress] = useState<number>(5);
  const [decisionConfidence, setDecisionConfidence] = useState<number>(5);
  const [selfEfficacy, setSelfEfficacy] = useState<number>(5);
  const [trustInSystem, setTrustInSystem] = useState<number>(5);
  const [trustInSelf, setTrustInSelf] = useState<number>(5);
  const [trustInDecisions, setTrustInDecisions] = useState<number>(5);
  const [processEngagement, setProcessEngagement] = useState<number>(5);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const response: SurveyResponse = {
      participantId,
      perceivedStress,
      decisionConfidence,
      selfEfficacy,
      trustInSystem,
      trustInSelf,
      trustInDecisions,
      processEngagement,
      comments: comments.trim() || undefined,
      completedAt: Date.now(),
    };

    onSubmit(response);
  };

  const renderLikertScale = (
    value: number,
    onChange: (value: number) => void,
    lowLabel: string,
    highLabel: string
  ) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between space-x-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
                value === num
                  ? 'bg-indigo-600 text-white border-indigo-600 scale-110'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Perceived Stress */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          1. How stressful did you find the task?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Rate your perceived stress level during the experiment
        </p>
        {renderLikertScale(
          perceivedStress,
          setPerceivedStress,
          'Not at all stressful',
          'Extremely stressful'
        )}
      </div>

      {/* Decision Confidence */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          2. How confident are you in the decisions you made?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Rate your confidence in the quality of your ticket decisions
        </p>
        {renderLikertScale(
          decisionConfidence,
          setDecisionConfidence,
          'Not confident at all',
          'Extremely confident'
        )}
      </div>

      {/* Self-Efficacy */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          3. How capable did you feel handling these support tickets?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Rate your sense of self-efficacy during the task
        </p>
        {renderLikertScale(
          selfEfficacy,
          setSelfEfficacy,
          'Not capable at all',
          'Extremely capable'
        )}
      </div>

      {/* Trust in System */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          4. How much did you trust the support system/tools provided?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Rate your trust in the assistance tools (if any were provided)
        </p>
        {renderLikertScale(
          trustInSystem,
          setTrustInSystem,
          'Did not trust at all',
          'Trusted completely'
        )}
      </div>

      {/* Trust in Self */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          5. How much did you trust your own judgment?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Rate your trust in your own decision-making abilities
        </p>
        {renderLikertScale(
          trustInSelf,
          setTrustInSelf,
          'Did not trust at all',
          'Trusted completely'
        )}
      </div>

      {/* Trust in Decisions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          6. How much do you trust the final decisions made for each ticket?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Rate your trust in the quality of the final outcomes
        </p>
        {renderLikertScale(
          trustInDecisions,
          setTrustInDecisions,
          'Do not trust at all',
          'Trust completely'
        )}
      </div>

      {/* Process Engagement */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          7. How engaged were you in the process?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Rate your level of engagement and attention during the task
        </p>
        {renderLikertScale(
          processEngagement,
          setProcessEngagement,
          'Not engaged at all',
          'Fully engaged'
        )}
      </div>

      {/* Comments */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          8. Additional Comments (Optional)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Please share any additional feedback, thoughts, or observations about your experience
        </p>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={6}
          placeholder="Your comments here..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-indigo-600 text-white px-12 py-4 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Survey'}
        </button>
      </div>
    </form>
  );
}
