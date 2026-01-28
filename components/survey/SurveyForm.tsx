'use client';

import { useMemo, useState } from 'react';
import { SurveyResponse } from '@/types';
import { tracking } from '@/lib/tracking';
import surveyConfig from '@/data/survey.json';

interface SurveyFormProps {
  participantId: string;
  onSubmit: (response: SurveyResponse) => void;
}

type SurveyQuestion = {
  id: string;
  type: 'likert' | 'text';
  text: string;
  description?: string;
  lowLabel?: string;
  highLabel?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
};

export default function SurveyForm({ participantId, onSubmit }: SurveyFormProps) {
  const questions = surveyConfig.questions as SurveyQuestion[];
  const initialAnswers = useMemo(() => {
    return questions.reduce<Record<string, number | string | null>>((acc, question) => {
      acc[question.id] = question.type === 'likert' ? null : '';
      return acc;
    }, {});
  }, [questions]);

  const [answers, setAnswers] = useState<Record<string, number | string | null>>(initialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors: Record<string, string> = {};

    questions.forEach((question) => {
      if (!question.required) return;
      const value = answers[question.id];

      if (question.type === 'likert' && typeof value !== 'number') {
        validationErrors[question.id] = 'Please select a response.';
      }

      if (question.type === 'text' && (!value || !String(value).trim())) {
        validationErrors[question.id] = 'Please enter a response.';
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFormError('Please complete all required fields before submitting.');
      setIsSubmitting(false);
      Object.entries(validationErrors).forEach(([field, message]) => {
        tracking.formValidationError('survey', field, message);
      });
      return;
    }

    const response: SurveyResponse = {
      participantId,
      perceivedStress: Number(answers.perceivedStress),
      decisionConfidence: Number(answers.decisionConfidence),
      selfEfficacy: Number(answers.selfEfficacy),
      trustInSystem: Number(answers.trustInSystem),
      trustInSelf: Number(answers.trustInSelf),
      trustInDecisions: Number(answers.trustInDecisions),
      processEngagement: Number(answers.processEngagement),
      comments: String(answers.comments).trim(),
      completedAt: Date.now(),
    };

    onSubmit(response);
  };

  const handleLikertChange = (question: SurveyQuestion, value: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
    setFormError(null);
    tracking.surveyQuestionAnswered(question.id, question.text, value, Date.now());
  };

  const handleTextChange = (question: SurveyQuestion, value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    if (errors[question.id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[question.id];
        return next;
      });
    }
    setFormError(null);
  };

  const renderLikertScale = (
    value: number | null,
    onChange: (value: number) => void,
    lowLabel: string,
    highLabel: string,
    questionText: string
  ) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between space-x-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onChange(num)}
              title={`Select ${num} for: ${questionText}`}
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
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {formError}
        </div>
      )}

      {questions.map((question, index) => {
        const hasError = Boolean(errors[question.id]);
        const cardClasses = hasError
          ? 'bg-red-50 border-red-300'
          : 'bg-white border-gray-200';

        return (
          <div
            key={question.id}
            className={`rounded-lg p-6 shadow-sm border ${cardClasses}`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {index + 1}. {question.text}
            </h3>
            {question.description && (
              <p className="text-sm text-gray-600 mb-4">
                {question.description}
              </p>
            )}

            {question.type === 'likert' ? (
              renderLikertScale(
                typeof answers[question.id] === 'number'
                  ? (answers[question.id] as number)
                  : null,
                (value) => handleLikertChange(question, value),
                question.lowLabel || '',
                question.highLabel || '',
                question.text
              )
            ) : (
              <textarea
                value={String(answers[question.id] ?? '')}
                onChange={(e) => handleTextChange(question, e.target.value)}
                onBlur={() => {
                  const value = answers[question.id];
                  if (value && String(value).trim()) {
                    tracking.surveyQuestionAnswered(
                      question.id,
                      question.text,
                      String(value).trim(),
                      Date.now()
                    );
                  }
                }}
                rows={question.rows || 4}
                placeholder={question.placeholder || ''}
                title={`Enter your response for: ${question.text}`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}

            {hasError && (
              <p className="text-sm text-red-600 mt-3">{errors[question.id]}</p>
            )}
          </div>
        );
      })}

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
