'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileLockout from '@/components/MobileLockout';
import { isLikelyMobile } from '@/lib/device';
import { storage } from '@/lib/storage';

export default function CompletePage() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [prolificRedirectUrl, setProlificRedirectUrl] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mobile = isLikelyMobile();
    setIsMobile(mobile);
    if (mobile) {
      return;
    }

    const session = storage.getSession();

    if (!session) {
      router.push('/');
      return;
    }

    setParticipantId(session.participantId);
    setProlificRedirectUrl(session.prolificRedirectUrl ?? null);

    // Mark session as ended
    storage.updateSession({ endTime: Date.now() });

    if (typeof window !== 'undefined' && window.location.search) {
      router.replace(window.location.pathname);
    }
  }, [router]);

  const prolificCompletionUrl = useMemo(() => {
    const url = new URL('https://app.prolific.co/submissions/complete');
    url.searchParams.set('cc', 'COMPLETION_CODE_HERE');
    if (prolificRedirectUrl) {
      url.searchParams.set('redirect_url', prolificRedirectUrl);
    }
    return url.toString();
  }, [prolificRedirectUrl]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !participantId) return;

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          email: email.trim(),
        }),
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit contact info:', error);
    }
  };

  const handleNewSession = () => {
    // Clear session and start fresh
    storage.clearSession();
    router.push('/');
  };

  if (isMobile) {
    return <MobileLockout />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8 md:p-12">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Thank You!
          </h1>
          <p className="text-lg text-gray-600">
            You have successfully completed the research study.
          </p>
        </div>

        {/* Completion Details */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-8 border border-green-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">What Happens Next?</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Your responses have been recorded and will be analyzed as part of our research.</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>All data is anonymized and will only be used for academic purposes.</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Research findings may be published in academic journals or conferences.</span>
            </li>
          </ul>
        </div>

        {/* Participant ID */}
        {participantId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Your Participant ID (for your records):</div>
            <div className="font-mono text-lg font-semibold text-gray-800">
              {participantId}
            </div>
          </div>
        )}

        {/* Prolific Completion */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            For Prolific Participants
          </h3>
          <p className="text-blue-800 text-sm mb-4">
            Please click the button below to return to Prolific and confirm your completion.
            You will receive your compensation once this step is complete.
          </p>
          <a
            href={prolificCompletionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
          >
            Complete Study on Prolific →
          </a>
          <p className="text-xs text-blue-700 mt-2">
            Note: Replace &quot;COMPLETION_CODE_HERE&quot; with the actual Prolific completion code
          </p>
        </div>

        {/* Optional Contact Form */}
        <div className="border-t border-gray-200 pt-6">
          {!showContact ? (
            <button
              onClick={() => setShowContact(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              Interested in study results? Leave your email
            </button>
          ) : !submitted ? (
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  Email address (optional)
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  title="Enter an email address to receive study results (optional)"
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </label>
              <p className="text-xs text-gray-600">
                We&apos;ll send you a summary of the study results when available.
              </p>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Submit Email
              </button>
            </form>
          ) : (
            <p className="text-green-600 text-sm font-medium">
              ✓ Thank you! We&apos;ll contact you when results are available.
            </p>
          )}
        </div>

        {/* Research Contact */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-2">
            Questions about this study? Contact the research team:
          </p>
          <p className="font-medium text-gray-700">
            researcher@university.edu
          </p>
        </div>

        {/* New Session Button (for testing) */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={handleNewSession}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Start a new session (for testing purposes)
          </button>
        </div>
      </div>
    </div>
  );
}
