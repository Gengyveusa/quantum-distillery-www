/**
 * src/components/StudyDashboard.tsx
 * Shows learner progress through 3 arms, per-arm scores,
 * and CSV export button.
 */

import useStudyStore, { type ArmResult } from '../store/useStudyStore';
import { analyticsEngine, type StudyArm } from '../engine/analytics';
import { STUDY_ARMS } from '../ai/studyArms';

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function StudyDashboard() {
  const {
    learnerId, armSequence, currentRotation,
    armResults, isStudyComplete, resetStudy,
    researchMode, setResearchMode,
  } = useStudyStore();

  const handleExportEvents = () => {
    const csv = analyticsEngine.exportCSV();
    if (csv) downloadCSV(csv, `sedsim_events_${learnerId}.csv`);
  };

  const handleExportSummary = () => {
    const csv = analyticsEngine.exportSummaryCSV();
    if (csv) downloadCSV(csv, `sedsim_summary_${learnerId}.csv`);
  };

  const handleClearData = () => {
    analyticsEngine.clearAllData();
    resetStudy();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Study Dashboard</h2>
        <div className="flex items-center gap-3">
          {learnerId && (
            <span className="text-xs font-mono text-gray-500">ID: {learnerId}</span>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-gray-400">Research Mode</span>
            <button
              onClick={() => setResearchMode(!researchMode)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                researchMode ? 'bg-green-600' : 'bg-gray-600'
              }`}
              role="switch"
              aria-checked={researchMode}
              aria-label="Toggle research mode"
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                researchMode ? 'translate-x-5' : ''
              }`} />
            </button>
          </label>
        </div>
      </div>

      {!researchMode && (
        <p className="text-sm text-gray-500 text-center py-4">
          Enable Research Mode to use the A/B study framework.
        </p>
      )}

      {researchMode && armSequence.length > 0 && (
        <>
          {/* Progress overview */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Rotation Progress
            </h3>
            <div className="flex gap-3">
              {armSequence.map((arm: StudyArm, idx: number) => {
                const result = armResults.find((r: ArmResult) => r.arm === arm);
                const isCurrent = idx === currentRotation && !isStudyComplete;
                const isCompleted = result?.completed ?? false;
                const config = STUDY_ARMS[arm];

                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-lg p-4 border-2 ${
                      isCurrent
                        ? 'bg-blue-900/50 border-blue-400'
                        : isCompleted
                          ? 'bg-gray-700 border-green-500'
                          : 'bg-gray-700/50 border-gray-600'
                    }`}
                  >
                    <div className="text-center space-y-2">
                      <div className="text-xs font-bold text-white">
                        Arm {arm}: {config.name}
                      </div>
                      {result && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Pre-test:</span>
                            <span className={`font-mono ${result.pretestScore >= 60 ? 'text-green-400' : 'text-gray-300'}`}>
                              {result.pretestScore}%
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Post-test:</span>
                            <span className={`font-mono ${result.posttestScore >= 60 ? 'text-green-400' : 'text-gray-300'}`}>
                              {result.posttestScore}%
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400">Gain:</span>
                            <span className={`font-mono font-bold ${
                              result.posttestScore - result.pretestScore > 0
                                ? 'text-green-400'
                                : result.posttestScore - result.pretestScore < 0
                                  ? 'text-red-400'
                                  : 'text-gray-400'
                            }`}>
                              {result.posttestScore - result.pretestScore > 0 ? '+' : ''}
                              {result.posttestScore - result.pretestScore}%
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="text-[10px]">
                        {isCompleted ? (
                          <span className="text-green-400 font-semibold">Complete</span>
                        ) : isCurrent ? (
                          <span className="text-white font-semibold">In Progress</span>
                        ) : (
                          <span className="text-gray-500">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Score summary */}
          {isStudyComplete && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center space-y-2">
              <div className="text-lg font-bold text-green-300">Study Complete!</div>
              <p className="text-xs text-green-400">
                Thank you for participating. You may export your data below.
              </p>
            </div>
          )}

          {/* Export controls */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Data Export
            </h3>
            <p className="text-xs text-gray-400">
              Export study data as CSV files compatible with SPSS and R for analysis.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleExportEvents}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors"
              >
                Export Events CSV
              </button>
              <button
                onClick={handleExportSummary}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold transition-colors"
              >
                Export Summary CSV
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded text-xs font-semibold transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
