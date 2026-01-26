'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { storage } from '@/lib/storage';
import { tracking } from '@/lib/tracking';
import { GroupType, TimingMode } from '@/types';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agreed, setAgreed] = useState(false);
  const [group, setGroup] = useState<GroupType | null>(null);
  const [timingMode, setTimingMode] = useState<TimingMode>('immediate');
  const [participantId, setParticipantId] = useState('');
  const [autoParticipantId, setAutoParticipantId] = useState('');

  useEffect(() => {
    // Initialize tracking
    tracking.init();

    // Parse URL parameters
    const groupParam = searchParams.get('group') as GroupType;
    const timingParam = searchParams.get('timing') as TimingMode;

    if (groupParam && ['1', '2', '3', '4'].includes(groupParam)) {
      setGroup(groupParam);
    }

    if (timingParam && ['immediate', 'staggered'].includes(timingParam)) {
      setTimingMode(timingParam);
    }

    // Check if already has session
    const existingSession = storage.getSession();
    if (existingSession) {
      router.push('/experiment');
    }

    setAutoParticipantId(`P${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  }, [searchParams, router]);

  const handleStart = () => {
    if (!agreed || !group) return;

    // Generate participant ID
    const finalParticipantId = participantId.trim() || autoParticipantId
      || `P${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Initialize session
    storage.initializeSession(finalParticipantId, group, timingMode);

    // Track experiment start
    tracking.experimentStarted(finalParticipantId, group, timingMode);

    // Navigate to experiment
    router.push('/experiment');
  };

  const getGroupDescription = (g: GroupType): string => {
    const descriptions = {
      '1': 'with Knowledge Base support',
      '2': 'with AI Chat Assistant',
      '3': 'with AI Agents (step-by-step confirmation)',
      '4': 'with Autonomous AI Agents',
    };
    return descriptions[g] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          Customer Support Ticket System Study
        </h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Welcome</h2>
            <p className="leading-relaxed">
              Thank you for participating in this research study. You will be processing
              customer support tickets in a realistic ticket system environment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Your Task</h2>
            <ul className="list-disc list-inside space-y-2 leading-relaxed">
              <li>You will process up to <strong>10 customer support tickets</strong></li>
              <li>You have <strong>15 minutes</strong> to complete as many as possible</li>
              <li>For each ticket, you will:
                <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                  <li>Read the customer's issue</li>
                  <li>Make decisions about priority, category, and assignment</li>
                  <li>Write a response to the customer</li>
                </ul>
              </li>
              {group && (
                <li className="text-indigo-600 font-medium">
                  You will work {getGroupDescription(group)}
                </li>
              )}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Important Information</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>Please work at a natural pace - this simulates real work conditions</li>
                <li>Try to complete tickets accurately and professionally</li>
                <li>You cannot pause or save progress midway</li>
                <li>After the timed session, you'll complete a brief survey</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Data Collection & Privacy</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded text-sm">
              <p className="mb-2">
                This study collects data for research purposes only:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your decisions and responses to tickets</li>
                <li>Time spent on each ticket and decision</li>
                <li>Mouse movement and click patterns</li>
                <li>Survey responses about your experience</li>
              </ul>
              <p className="mt-2">
                All data is anonymized and will only be used for academic research.
                Your participation is voluntary and you may withdraw at any time.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Participant ID</h2>
            <div className="bg-gray-50 border border-gray-200 p-4 rounded">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Optional custom ID
              </label>
              <input
                type="text"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="Leave blank to auto-generate"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="mt-2 text-sm text-gray-600">
                Current ID: {participantId.trim() || autoParticipantId || 'Pending'}
              </p>
            </div>
          </section>

          <section>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-gray-700 leading-relaxed">
                I have read and understood the information above. I consent to participate
                in this research study and to the collection of data as described.
              </span>
            </label>
          </section>

          {!group && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-red-700 font-medium">
                Invalid access link. Please use the link provided to you.
              </p>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!agreed || !group}
            className={`w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all ${
              agreed && group
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {agreed && group ? 'Start Experiment' : 'Please Accept Terms to Continue'}
          </button>

          <p className="text-sm text-gray-500 text-center">
            Estimated completion time: 20-25 minutes (including survey)
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
