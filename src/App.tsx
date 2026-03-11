import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import useSimStore from './store/useSimStore';
import useAIStore from './store/useAIStore';
import useLMSStore from './store/useLMSStore';
import useStudyStore from './store/useStudyStore';
import PatientBanner from './components/PatientBanner';
import PatientSelector from './components/PatientSelector';
import DrugPanel from './components/DrugPanel';
import InterventionPanel from './components/InterventionPanel';
import MonitorPanel from './components/MonitorPanel';
import LocalAnesthPanel from './components/LocalAnesthPanel';
import EmergencyDrugsPanel from './components/EmergencyDrugsPanel';
import IVFluidsPanel from './components/IVFluidsPanel';
import TrendGraph from './components/TrendGraph';
import ControlBar from './components/ControlBar';
import EventLog from './components/EventLog';
import SedationGauge from './components/SedationGauge';
import AEDPanel from './components/AEDPanel';
import SimMasterOverlay from './components/SimMasterOverlay';
import { Dashboard } from './components/Dashboard';
import OfflineBanner from './components/OfflineBanner';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import LMSPanel from './components/LMSPanel';
import StudyEnrollment from './components/StudyEnrollment';
import TestFramework from './components/TestFramework';
import StudyDashboard from './components/StudyDashboard';
import { usePerformanceObserver } from './hooks/usePerformanceObserver';

export default function App() {
  const { t } = useTranslation();

  // Dev-mode performance monitoring
  usePerformanceObserver();

  // Narrow subscription: only the fields needed for the tick loop and layout.
  const { isRunning, speedMultiplier, tick } = useSimStore(
    useShallow(s => ({ isRunning: s.isRunning, speedMultiplier: s.speedMultiplier, tick: s.tick }))
  );
  const trendData = useSimStore(s => s.trendData);
  const vitals = useSimStore(s => s.vitals);
  const [trendsExpanded, setTrendsExpanded] = useState(false);
  const [airwayExpanded, setAirwayExpanded] = useState(false);
  // Mobile/tablet: left panel slide-over drawer
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const simMasterEnabled = useAIStore(s => s.simMasterEnabled);
  const { initScorm, terminateScorm } = useLMSStore();

  // Study framework state
  const researchMode = useStudyStore(s => s.researchMode);
  const setResearchMode = useStudyStore(s => s.setResearchMode);
  const studyPhase = useStudyStore(s => s.phase);
  const currentArm = useStudyStore(s => s.currentArm);
  const learnerId = useStudyStore(s => s.learnerId);
  const completePretestScore = useStudyStore(s => s.completePretestScore);
  const startPosttest = useStudyStore(s => s.startPosttest);
  const completePosttestScore = useStudyStore(s => s.completePosttestScore);
  const completeCurrentArm = useStudyStore(s => s.completeCurrentArm);
  const advanceToNextArm = useStudyStore(s => s.advanceToNextArm);
  const setPhase = useStudyStore(s => s.setPhase);

  // Swipe gesture state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Initialise SCORM session on mount; terminate on unmount
  useEffect(() => {
    initScorm();
    return () => terminateScorm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore study state from localStorage on mount
  useEffect(() => {
    useStudyStore.getState().loadFromStorage();
  }, []);

  // Memoize the vitals history array so MonitorPanel's memo check stays stable.
  const vitalsHistory = useMemo(() => trendData.map(t => t.vitals), [trendData]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const ticks = Math.round(speedMultiplier);
      for (let i = 0; i < ticks; i++) {
        tick();
      }
    }, 1000 / (speedMultiplier / Math.round(speedMultiplier) || 1));
    return () => clearInterval(interval);
  }, [isRunning, speedMultiplier, tick]);

  // Close mobile left panel when screen gets large enough
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setLeftPanelOpen(false);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Swipe handlers: swipe right from left edge opens drawer, swipe left closes it
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only handle horizontal swipes (dx dominant over dy)
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx > 0 && touchStartX.current < 48) {
        // Swipe right from left edge → open drawer
        setLeftPanelOpen(true);
      } else if (dx < 0 && leftPanelOpen) {
        // Swipe left anywhere → close drawer
        setLeftPanelOpen(false);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [leftPanelOpen]);

  // Determine if we should show the study overlay
  const showStudyOverlay = researchMode && studyPhase !== 'simulation';

  return (
    <>
      {/* Skip navigation for keyboard users */}
      <a href="#sim-main" className="skip-link">Skip to main content</a>

      <div
        className="h-screen flex flex-col bg-sim-bg text-white overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Offline Banner */}
        <OfflineBanner />
        {/* Top Banner — includes hamburger on mobile/tablet */}
        <div className="flex items-stretch border-b border-gray-700 bg-sim-panel shrink-0">
          {/* Hamburger button: visible only below lg breakpoint */}
          <button
            className="lg:hidden flex items-center justify-center w-11 h-full px-2 text-gray-400 hover:text-white hover:bg-gray-700/60 transition-colors touch-target shrink-0"
            onClick={() => setLeftPanelOpen(v => !v)}
            aria-label="Toggle drug controls"
            title="Drug Controls"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <PatientBanner />
          </div>
        </div>

        {/* Main Content */}
        <div id="sim-main" className="flex-1 flex overflow-hidden relative" role="main" aria-label="Sedation simulator workspace">

          {/* ── Mobile/Tablet overlay backdrop ── */}
          {leftPanelOpen && (
            <div
              className="lg:hidden fixed inset-0 z-30 bg-black/50"
              onClick={() => setLeftPanelOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* Left Panel - Drug Controls */}
          <div className={`
            lg:static lg:translate-x-0 lg:w-72 lg:flex lg:flex-col lg:shrink-0
            border-r border-gray-700 bg-sim-bg overflow-y-auto p-2 space-y-2
            fixed inset-y-0 left-0 z-40 w-72
            transition-transform duration-300 ease-in-out
            ${leftPanelOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
            role="complementary" aria-label="Drug and intervention controls"
          >
            {/* Close button inside the drawer (mobile/tablet only) */}
            <div className="lg:hidden flex items-center justify-between py-2 px-1 border-b border-gray-700 mb-1">
              <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Drug Controls</span>
              <button
                className="touch-target text-gray-400 hover:text-white p-1"
                onClick={() => setLeftPanelOpen(false)}
                aria-label="Close drug controls"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <PatientSelector />
            <DrugPanel />
            <LocalAnesthPanel />
            <EmergencyDrugsPanel />
            <IVFluidsPanel />

            {/* SimMaster Panel */}
            <div className="border border-gray-700 rounded p-3 bg-gray-800/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{"\ud83c\udfaf"}</span>
                <span className="text-sm font-bold text-white">{t('app.simmaster.title')}</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {t('app.simmaster.description')}
              </p>
              <button
                onClick={() => {
                  const store = useAIStore.getState();
                  store.setSimMasterEnabled(!store.simMasterEnabled);
                }}
                aria-label={simMasterEnabled ? 'Disable SimMaster AI observer' : 'Enable SimMaster AI observer'}
                aria-pressed={simMasterEnabled}
                className={`px-4 py-2 rounded text-white text-sm font-bold transition-colors w-full min-h-[44px] ${
                  simMasterEnabled
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-purple-600 hover:bg-purple-500'
                }`}
              >
                {simMasterEnabled ? t('app.simmaster.disable') : t('app.simmaster.enable')}
              </button>
              {simMasterEnabled && (
                <p className="text-[10px] text-green-400 mt-2 animate-pulse">
                  {t('app.simmaster.active')}
                </p>
              )}
            </div>
          </div>

          {/* Center - Hero Gauge + Monitor (always takes remaining space) */}
          <div className="flex-1 flex flex-col overflow-hidden relative min-w-0" role="region" aria-label="Patient monitor and sedation gauge">
            {/* Compact vitals monitor strip at top */}
            <MonitorPanel vitals={vitals} history={vitalsHistory} />
            {/* HERO: Giant Sedation Gauge */}
            <div className="flex-1 overflow-y-auto">
              <SedationGauge />
              {/* AED Panel — bottom of center column */}
              <div className="px-2 pb-2">
                <AEDPanel />
              </div>
            </div>
          </div>

          {/* Right Sidebar - Collapsible Intervention Panel */}
          <div className="hidden md:flex flex-row">
            {!airwayExpanded && (
              <button
                onClick={() => setAirwayExpanded(true)}
                className="h-full w-10 flex items-center justify-center bg-gray-800/60 hover:bg-gray-700/80 transition-colors group touch-target"
                title={t('app.simmaster.expandAirway')}
                aria-label="Show Airway and O2 controls"
                aria-expanded={false}
                aria-controls="airway-panel"
              >
                <span className="text-xs text-gray-400 group-hover:text-cyan-400 whitespace-nowrap tracking-wider uppercase" style={{ writingMode: 'vertical-rl' as const, textOrientation: 'mixed' as const }}>{t('app.simmaster.airwayLabel')}</span>
              </button>
            )}
            {airwayExpanded && (
              <div id="airway-panel" className="flex flex-col h-full bg-sim-panel" role="region" aria-label="Airway and O2 controls">
                <div className="flex items-center justify-between px-2 py-1 border-b border-gray-700">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{t('app.simmaster.airwayTitle')}</span>
                  <button
                    onClick={() => setAirwayExpanded(false)}
                    className="text-gray-400 hover:text-white text-sm px-2 py-1 touch-target"
                    title={t('app.simmaster.collapseAirway')}
                    aria-label="Collapse Airway and O2 panel"
                    aria-expanded={true}
                    aria-controls="airway-panel"
                  >
                    &laquo;
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <InterventionPanel />
                </div>
              </div>
            )}
          </div>

          {/* Right side: LMS Panel + Event Log + Collapsible Trends */}
          <div className="hidden md:flex flex-row" role="complementary" aria-label="Trends and event log">
            {/* LMS / xAPI / SCORM Panel */}
            <LMSPanel />
            {/* Trends Panel - collapsible side drawer */}
            <div
              className={`transition-all duration-300 ease-in-out border-l border-gray-700 overflow-hidden flex flex-col ${
                trendsExpanded ? 'w-80' : 'w-10'
              }`}
            >
              {/* Collapsed: vertical tab button */}
              {!trendsExpanded && (
                <button
                  onClick={() => setTrendsExpanded(true)}
                  className="h-full w-10 flex items-center justify-center bg-gray-800/60 hover:bg-gray-700/80 transition-colors group touch-target"
                  title={t('app.simmaster.expandTrends')}
                  aria-label="Show Trend Graphs panel"
                  aria-expanded={false}
                  aria-controls="trends-panel"
                >
                  <span className="text-xs text-gray-400 group-hover:text-cyan-400 whitespace-nowrap tracking-wider uppercase" style={{ writingMode: 'vertical-rl' as const, textOrientation: 'mixed' as const }}>{t('app.simmaster.trendsLabel')}</span>
                </button>
              )}
              {/* Expanded: full trend panel */}
              {trendsExpanded && (
                <div id="trends-panel" className="flex flex-col h-full bg-sim-panel" role="region" aria-label="Trend graphs">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-gray-700">
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{t('app.simmaster.trendsTitle')}</span>
                    <button
                      onClick={() => setTrendsExpanded(false)}
                      className="text-gray-400 hover:text-white text-sm px-2 py-1 touch-target"
                      title={t('app.simmaster.collapseTrends')}
                      aria-label="Collapse Trend Graphs panel"
                      aria-expanded={true}
                      aria-controls="trends-panel"
                    >
                      &raquo;
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <TrendGraph />
                  </div>
                </div>
              )}
            </div>

            {/* Event Log */}
            <div className="w-72 border-l border-gray-700 overflow-y-auto">
              <EventLog />
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <ControlBar />
      </div>
      {/* AI Dashboard */}
      <div className="fixed bottom-20 right-4 z-40">
        <Dashboard />
      </div>
      <SimMasterOverlay enabled={simMasterEnabled} />
      <PWAInstallPrompt />

      {/* Research Mode toggle button — fixed bottom-left */}
      <button
        onClick={() => setResearchMode(!researchMode)}
        className={`fixed bottom-16 left-4 z-50 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg ${
          researchMode
            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
            : 'bg-gray-700/80 text-gray-400 hover:bg-gray-600 hover:text-white'
        }`}
        title={researchMode ? 'Research Mode ON' : 'Enable Research Mode'}
      >
        {researchMode ? 'Research ON' : 'Research Mode'}
      </button>

      {/* Study framework overlay — shown when research mode is active and not in simulation phase */}
      {showStudyOverlay && (
        <div className="fixed inset-0 z-[100] bg-gray-950/95 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-h-full py-8">
            {(studyPhase === 'not_enrolled' || studyPhase === 'consent') && <StudyEnrollment />}
            {studyPhase === 'pretest' && (
              <TestFramework
                testType="pretest"
                onComplete={(score) => {
                  completePretestScore(score);
                  setPhase('simulation');
                }}
              />
            )}
            {studyPhase === 'posttest' && (
              <TestFramework
                testType="posttest"
                onComplete={(score) => {
                  completePosttestScore(score);
                  completeCurrentArm();
                  advanceToNextArm();
                }}
              />
            )}
            {studyPhase === 'between_arms' && (
              <div className="max-w-lg mx-auto p-6 bg-gray-900 border border-gray-700 rounded-xl space-y-4 text-center">
                <h2 className="text-lg font-bold text-white">Arm Complete!</h2>
                <p className="text-sm text-gray-400">
                  Great work! Ready for the next learning arm?
                </p>
                <StudyEnrollment />
                <button
                  onClick={() => setPhase('pretest')}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold transition-colors"
                >
                  Start Next Arm
                </button>
              </div>
            )}
            {studyPhase === 'completed' && <StudyDashboard />}

            {/* Exit research mode link */}
            {(studyPhase === 'not_enrolled' || studyPhase === 'consent' || studyPhase === 'completed') && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setResearchMode(false)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Exit Research Mode
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Study active indicator bar — shown during simulation in research mode */}
      {researchMode && studyPhase === 'simulation' && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-emerald-900/90 text-emerald-200 text-[10px] font-semibold text-center py-1 flex items-center justify-center gap-4">
          <span>RESEARCH MODE &mdash; Arm {currentArm} | ID: {learnerId}</span>
          <button
            onClick={startPosttest}
            className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 rounded text-[10px] transition-colors"
          >
            End Session &rarr; Post-Test
          </button>
        </div>
      )}
    </>
  );
}
