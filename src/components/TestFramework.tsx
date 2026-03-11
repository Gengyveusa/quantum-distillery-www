/**
 * src/components/TestFramework.tsx
 * Pre/Post test UI for the A/B study framework.
 * Renders MCQ questions from the question bank, 5 per test,
 * with timer and analytics recording.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getQuestionsForRotation, type MCQuestion } from '../engine/questionBank';
import { analyticsEngine, type TelemetryEventType } from '../engine/analytics';
import useStudyStore from '../store/useStudyStore';

interface TestFrameworkProps {
  testType: 'pretest' | 'posttest';
  onComplete: (score: number) => void;
}

export default function TestFramework({ testType, onComplete }: TestFrameworkProps) {
  const { currentRotation } = useStudyStore();
  const questions = useMemo(() => getQuestionsForRotation(currentRotation + 1), [currentRotation]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const questionStartRef = useRef(0);

  // Initialize the question start timestamp on mount
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, []);

  // Timer
  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [isComplete]);

  // Reset question timer on advance
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentIdx]);

  const currentQ: MCQuestion | undefined = questions[currentIdx];

  const eventType: TelemetryEventType = testType === 'pretest' ? 'pretest_answer' : 'posttest_answer';

  const handleSelect = useCallback((optionIdx: number) => {
    if (showFeedback) return;
    setSelectedAnswer(optionIdx);
  }, [showFeedback]);

  const handleSubmit = useCallback(() => {
    if (selectedAnswer === null || !currentQ) return;

    const correct = selectedAnswer === currentQ.correctIndex;
    const latency = Date.now() - questionStartRef.current;

    if (correct) setCorrectCount(c => c + 1);

    // Log to analytics
    analyticsEngine.log(eventType, {
      questionId: currentQ.id,
      answer: selectedAnswer,
      correct,
      latency_ms: latency,
      topic: currentQ.topic,
      difficulty: currentQ.difficulty,
    });

    setShowFeedback(true);
  }, [selectedAnswer, currentQ, eventType]);

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      const score = Math.round((correctCount / questions.length) * 100);
      setIsComplete(true);
      onComplete(score);
      return;
    }
    setCurrentIdx(i => i + 1);
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [currentIdx, questions.length, correctCount, onComplete, selectedAnswer, currentQ?.correctIndex]);

  const formatTimer = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (isComplete) {
    const score = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center space-y-4">
          <h3 className="text-lg font-bold text-white">
            {testType === 'pretest' ? 'Pre-Test' : 'Post-Test'} Complete
          </h3>
          <div className="text-4xl font-mono font-bold text-cyan-400">
            {correctCount}/{questions.length}
          </div>
          <div className="text-sm text-gray-400">
            Score: {score}% | Time: {formatTimer(elapsed)}
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center text-gray-400">
        No questions available for this rotation.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">
          {testType === 'pretest' ? 'Pre-Test' : 'Post-Test'} — Question {currentIdx + 1}/{questions.length}
        </h3>
        <span className="text-xs font-mono text-gray-500">
          {formatTimer(elapsed)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 transition-all duration-300"
          style={{ width: `${((currentIdx + (showFeedback ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-gray-800 rounded-lg p-5 space-y-4">
        <div className="flex items-start gap-2">
          <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-[10px] rounded font-semibold">
            {currentQ.topic}
          </span>
          <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-[10px] rounded font-semibold">
            {currentQ.difficulty}
          </span>
        </div>
        <p className="text-sm text-white leading-relaxed">{currentQ.stem}</p>

        {/* Options */}
        <div className="space-y-2">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === currentQ.correctIndex;
            let style = 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500';
            if (showFeedback) {
              if (isCorrect) {
                style = 'bg-green-900/60 border-green-500 text-green-200';
              } else if (isSelected && !isCorrect) {
                style = 'bg-red-900/60 border-red-500 text-red-200';
              } else {
                style = 'bg-gray-700/50 border-gray-700 text-gray-500';
              }
            } else if (isSelected) {
              style = 'bg-blue-900/60 border-blue-500 text-blue-200';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={showFeedback}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${style}`}
              >
                <span className="font-mono text-xs mr-2 opacity-60">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <div className={`rounded-lg p-3 text-xs ${
            selectedAnswer === currentQ.correctIndex
              ? 'bg-green-900/40 text-green-200 border border-green-700'
              : 'bg-red-900/40 text-red-200 border border-red-700'
          }`}>
            <p className="font-semibold mb-1">
              {selectedAnswer === currentQ.correctIndex ? 'Correct!' : 'Incorrect'}
            </p>
            <p>{currentQ.explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {!showFeedback ? (
            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded text-sm font-semibold transition-colors"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-sm font-semibold transition-colors"
            >
              {currentIdx + 1 >= questions.length ? 'Finish' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
