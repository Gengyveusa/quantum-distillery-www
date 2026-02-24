// src/components/SimMasterOverlay.tsx
// Beautiful floating overlay for SimMaster v2 - displays real-time
// vital sign assessments with color-coded status indicators and
// clinical observations pointing to specific UI regions.

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  SimMasterAnnotation,
  SCREEN_REGIONS,
  generateObservation,
  assessAllVitals,
  hasSignificantChange,
  VitalAssessment,
  ClinicalStatus,
} from '../ai/simMaster';
import useSimStore from '../store/useSimStore';

interface SimMasterOverlayProps {
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Status colors and icons
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<ClinicalStatus, {
  bg: string; border: string; text: string; dot: string; glow: string; icon: string;
}> = {
  normal:   { bg: 'bg-emerald-950/80', border: 'border-emerald-500/60', text: 'text-emerald-300', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20', icon: '\u2713' },
  warning:  { bg: 'bg-amber-950/80',   border: 'border-amber-500/60',   text: 'text-amber-300',   dot: 'bg-amber-400',   glow: 'shadow-amber-500/30',   icon: '\u26A0' },
  danger:   { bg: 'bg-red-950/80',     border: 'border-red-500/60',     text: 'text-red-300',     dot: 'bg-red-500',     glow: 'shadow-red-500/40',     icon: '\u2716' },
  critical: { bg: 'bg-red-950/90',     border: 'border-red-400',        text: 'text-red-200',     dot: 'bg-red-400',     glow: 'shadow-red-500/60',     icon: '\u203C' },
};

const SEVERITY_STYLES: Record<string, {
  bg: string; border: string; text: string; headerBg: string; glow: string;
}> = {
  info:    { bg: 'bg-slate-900/95',  border: 'border-cyan-500/50',   text: 'text-cyan-200',   headerBg: 'bg-cyan-900/60',   glow: 'shadow-cyan-500/20' },
  warning: { bg: 'bg-slate-900/95',  border: 'border-amber-500/50',  text: 'text-amber-200',  headerBg: 'bg-amber-900/60',  glow: 'shadow-amber-500/30' },
  danger:  { bg: 'bg-slate-900/95',  border: 'border-red-500/60',    text: 'text-red-200',    headerBg: 'bg-red-900/60',    glow: 'shadow-red-500/40' },
};

// ---------------------------------------------------------------------------
// Vital Pill component
// ---------------------------------------------------------------------------
const VitalPill: React.FC<{ a: VitalAssessment }> = ({ a }) => {
  const c = STATUS_CONFIG[a.status];
  const pulse = a.status === 'critical' || a.status === 'danger' ? 'animate-pulse' : '';
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${c.border} ${c.bg} ${pulse}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} inline-block flex-shrink-0`} />
      <span className={`text-xs font-bold ${c.text}`}>{a.label}</span>
      <span className="text-xs text-gray-400">{a.value}{a.unit}</span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const SimMasterOverlay: React.FC<SimMasterOverlayProps> = ({ enabled }) => {
  const [annotation, setAnnotation] = useState<SimMasterAnnotation | null>(null);
  const [assessments, setAssessments] = useState<VitalAssessment[]>([]);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const simState = useSimStore((s) => ({
    vitals: s.vitals,
    moass: s.moass,
    eegState: s.eegState,
    pkStates: s.pkStates,
    isRunning: s.isRunning,
  }));

  // Find target DOM element
  const updateTargetPosition = useCallback((targetId: string) => {
    const region = SCREEN_REGIONS[targetId];
    if (!region) return;
    const el = document.querySelector(region.selector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, []);

  // Determine overall status
  const overallStatus = useMemo<ClinicalStatus>(() => {
    if (assessments.some(a => a.status === 'critical')) return 'critical';
    if (assessments.some(a => a.status === 'danger')) return 'danger';
    if (assessments.some(a => a.status === 'warning')) return 'warning';
    return 'normal';
  }, [assessments]);

  // Proactive evaluation loop - runs every 3 seconds, fully offline
  useEffect(() => {
    if (!enabled || !simState.isRunning) {
      setAnnotation(null);
      setAssessments([]);
      setIsVisible(false);
      return;
    }

    const evaluate = () => {
      const snapshot = {
        vitals: simState.vitals,
        moass: simState.moass,
        eeg: simState.eegState ?? undefined,
        pkStates: simState.pkStates,
      };

      // Always update vital assessments
      const allVitals = assessAllVitals(
        simState.vitals,
        simState.moass,
        simState.eegState ?? undefined,
        simState.pkStates
      );
      setAssessments(allVitals);

      // Only update annotation on significant change
      if (hasSignificantChange(snapshot)) {
        const obs = generateObservation(
          simState.vitals,
          simState.moass,
          simState.eegState ?? undefined,
          simState.pkStates
        );
        setAnnotation(obs);
        updateTargetPosition(obs.target);
        setIsVisible(true);

        // Auto-cycle annotations every 12 seconds
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setAnnotation(null), 400);
        }, 12000);
      }
    };

    // Run immediately
    evaluate();
    const interval = setInterval(evaluate, 3000);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, simState, updateTargetPosition]);

  // Update position on resize
  useEffect(() => {
    if (!annotation) return;
    const handleResize = () => updateTargetPosition(annotation.target);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [annotation, updateTargetPosition]);

  if (!enabled || !simState.isRunning) return null;

  const sev = annotation ? SEVERITY_STYLES[annotation.severity] ?? SEVERITY_STYLES.info : SEVERITY_STYLES.info;
  const statusColor = STATUS_CONFIG[overallStatus];

  // Highlight ring around target element
  const highlightStyle: React.CSSProperties | null = targetRect && annotation && isVisible ? {
    position: 'fixed',
    left: targetRect.left - 4,
    top: targetRect.top - 4,
    width: targetRect.width + 8,
    height: targetRect.height + 8,
    zIndex: 9998,
    pointerEvents: 'none' as const,
    borderRadius: 8,
    opacity: 1,
    transition: 'all 0.4s ease',
  } : null;

  return (
    <>
      {/* Highlight ring around target */}
      {highlightStyle && (
        <div
          style={highlightStyle}
          className={`border-2 ${
            annotation?.severity === 'danger' ? 'border-red-500 simmaster-pulse-ring' :
            annotation?.severity === 'warning' ? 'border-amber-400 simmaster-glow-ring' :
            'border-cyan-400/60'
          }`}
        />
      )}

      {/* Main SimMaster panel - bottom right */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          width: isExpanded ? 320 : 48,
          transition: 'width 0.3s ease',
        }}
      >
        {/* Collapsed state - just a status orb */}
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className={`w-12 h-12 rounded-full ${statusColor.bg} border-2 ${statusColor.border} flex items-center justify-center shadow-lg ${statusColor.glow} hover:scale-110 transition-transform cursor-pointer`}
            title="Expand SimMaster"
          >
            <span className={`text-lg ${statusColor.text}`}>{statusColor.icon}</span>
          </button>
        )}

        {/* Expanded panel */}
        {isExpanded && (
          <div className={`rounded-xl border ${sev.border} ${sev.bg} backdrop-blur-md shadow-2xl ${sev.glow} overflow-hidden`}>
            {/* Header */}
            <div className={`flex items-center justify-between px-3 py-2 ${sev.headerBg} border-b ${sev.border}`}>
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColor.dot} ${
                  overallStatus === 'critical' || overallStatus === 'danger' ? 'animate-pulse' : ''
                }`} />
                <span className="text-sm font-bold text-white tracking-wide">SimMaster</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                  {overallStatus.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-white text-sm leading-none px-1 cursor-pointer"
                title="Minimize"
              >
                \u2014
              </button>
            </div>

            {/* Vital sign pills */}
            {assessments.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-700/50">
                <div className="flex flex-wrap gap-1.5">
                  {assessments.map((a) => (
                    <VitalPill key={a.param} a={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Clinical observation */}
            {annotation && isVisible && (
              <div className="px-3 py-2.5">
                <p className={`text-sm leading-relaxed ${sev.text}`}>
                  {annotation.message}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-gray-500">\u27A4</span>
                  <span className="text-[10px] text-gray-500">
                    {SCREEN_REGIONS[annotation.target]?.label ?? annotation.target}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes simmaster-pulse-ring-kf {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }
        .simmaster-pulse-ring {
          animation: simmaster-pulse-ring-kf 1.5s ease-in-out infinite;
        }
        @keyframes simmaster-glow-ring-kf {
          0%, 100% { box-shadow: 0 0 4px rgba(245, 158, 11, 0.3); }
          50% { box-shadow: 0 0 12px rgba(245, 158, 11, 0.5); }
        }
        .simmaster-glow-ring {
          animation: simmaster-glow-ring-kf 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default SimMasterOverlay;
