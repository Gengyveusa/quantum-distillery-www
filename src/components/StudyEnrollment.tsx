/**
 * src/components/StudyEnrollment.tsx
 * Enrollment UI for the A/B study framework.
 * Anonymized learner ID generation, informed consent,
 * Latin-square randomized arm assignment, rotation progress display.
 */

import { useState } from 'react';
import useStudyStore from '../store/useStudyStore';
import { STUDY_ARMS } from '../ai/studyArms';
import type { StudyArm } from '../engine/analytics';

const ARM_LABELS: Record<StudyArm, { color: string; icon: string }> = {
  A: { color: 'bg-blue-600', icon: '\u{1F3AE}' },
  B: { color: 'bg-purple-600', icon: '\u{1F393}' },
  C: { color: 'bg-amber-600', icon: '\u{1F4CB}' },
};

export default function StudyEnrollment() {
  const {
    learnerId, setLearnerId, generateLearnerId,
    consentGiven, giveConsent,
    armSequence, currentRotation, assignArms,
    setPhase, saveToStorage,
  } = useStudyStore();

  const [customId, setCustomId] = useState('');
  const [step, setStep] = useState<'id' | 'consent' | 'assigned'>(
    learnerId ? (consentGiven ? 'assigned' : 'consent') : 'id'
  );

  const handleGenerateId = () => {
    generateLearnerId();
    setStep('consent');
  };

  const handleCustomId = () => {
    if (customId.trim()) {
      setLearnerId(customId.trim());
      setStep('consent');
    }
  };

  const handleConsent = () => {
    giveConsent();
    assignArms();
    saveToStorage();
    setStep('assigned');
  };

  const handleStartStudy = () => {
    setPhase('pretest');
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold text-white text-center">
        SedSim Research Study Enrollment
      </h2>

      {/* Step 1: ID */}
      {step === 'id' && (
        <div className="bg-gray-800 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Step 1: Learner Identification
          </h3>
          <p className="text-xs text-gray-400">
            Your identity will be anonymized. You can generate a random ID or enter a custom one.
            No personally identifiable health information (PHI) is collected.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleGenerateId}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold transition-colors"
            >
              Generate Anonymous ID
            </button>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-600" />
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-600" />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomId()}
                placeholder="Enter custom anonymous ID..."
                className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleCustomId}
                disabled={!customId.trim()}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded text-sm transition-colors"
              >
                Use
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Consent */}
      {step === 'consent' && (
        <div className="bg-gray-800 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Step 2: Informed Consent
          </h3>
          <div className="bg-gray-700/50 rounded p-4 text-xs text-gray-300 space-y-2 max-h-48 overflow-y-auto">
            <p className="font-semibold text-white">Educational Research Study — SedSim</p>
            <p>
              This study compares three AI-assisted teaching approaches for procedural
              sedation education. You will complete three simulation sessions, each with
              a different AI teaching style, preceded and followed by short knowledge assessments.
            </p>
            <p>
              <strong>Data collected:</strong> Anonymized interaction data (drug choices,
              timing, test scores, AI interactions). No personally identifiable health
              information (PHI) is collected. Your anonymous learner ID ({learnerId}) cannot
              be traced back to you.
            </p>
            <p>
              <strong>Duration:</strong> Approximately 45-60 minutes total across 3 sessions.
            </p>
            <p>
              <strong>Voluntary participation:</strong> You may withdraw at any time without
              consequence. All data is stored locally in your browser and can be deleted.
            </p>
            <p>
              <strong>Purpose:</strong> To determine which AI teaching method most effectively
              improves clinical knowledge in procedural sedation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="text-blue-400 font-mono">ID: {learnerId}</span>
          </div>
          <button
            onClick={handleConsent}
            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-semibold transition-colors"
          >
            I Consent — Enroll in Study
          </button>
        </div>
      )}

      {/* Step 3: Assignment */}
      {step === 'assigned' && (
        <div className="bg-gray-800 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Study Assignment
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Learner ID:</span>
            <span className="text-blue-400 font-mono">{learnerId}</span>
          </div>

          {/* Arm sequence visualization */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Your randomized rotation sequence:</p>
            <div className="flex gap-2">
              {armSequence.map((arm, idx) => {
                const config = STUDY_ARMS[arm];
                const { color, icon } = ARM_LABELS[arm];
                const isCurrent = idx === currentRotation;
                const isCompleted = idx < currentRotation;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-lg p-3 border-2 transition-all ${
                      isCurrent
                        ? `${color} border-white text-white`
                        : isCompleted
                        ? 'bg-gray-700 border-green-500 text-green-400'
                        : 'bg-gray-700/50 border-gray-600 text-gray-500'
                    }`}
                  >
                    <div className="text-center space-y-1">
                      <div className="text-lg">{icon}</div>
                      <div className="text-xs font-bold">Arm {arm}</div>
                      <div className="text-[10px]">{config.name}</div>
                      {isCompleted && <div className="text-[10px]">Done</div>}
                      {isCurrent && <div className="text-[10px] font-bold">Current</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-700/50 rounded p-3 text-xs text-gray-300">
            <p className="font-semibold text-white mb-1">
              Rotation {currentRotation + 1} of 3: Arm {armSequence[currentRotation]}
            </p>
            <p>{STUDY_ARMS[armSequence[currentRotation]].description}</p>
          </div>

          <button
            onClick={handleStartStudy}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-bold transition-colors"
          >
            Start Pre-Test
          </button>
        </div>
      )}
    </div>
  );
}
