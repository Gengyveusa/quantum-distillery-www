// src/components/SimMasterOverlay.tsx
// Floating annotation overlay for SimMaster - points to UI elements
// and displays proactive AI observations with visual callouts.

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SimMasterAnnotation, SCREEN_REGIONS, querySimMaster, hasSignificantChange } from '../ai/simMaster';
import { ClaudeContext } from '../ai/claudeClient';
import useSimStore from '../store/useSimStore';

interface SimMasterOverlayProps {
  enabled: boolean;
}

const SimMasterOverlay: React.FC<SimMasterOverlayProps> = ({ enabled }) => {
  const [annotation, setAnnotation] = useState<SimMasterAnnotation | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const simState = useSimStore((s) => ({
    vitals: s.vitals,
    moass: s.moass,
    eegState: s.eegState,
    pkStates: s.pkStates,
    eventLog: s.eventLog,
    patient: s.patient,
    digitalTwin: s.digitalTwin,
    elapsedSeconds: s.elapsedSeconds,
    isRunning: s.isRunning,
  }));

  // Find the target DOM element and get its bounding rect
  const updateTargetPosition = useCallback((targetId: string) => {
    const region = SCREEN_REGIONS[targetId];
    if (!region) return;
    const el = document.querySelector(region.selector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, []);

  // Proactive evaluation loop
  useEffect(() => {
    if (!enabled || !simState.isRunning) {
      setAnnotation(null);
      setIsVisible(false);
      return;
    }

    const interval = setInterval(async () => {
      const snapshot = {
        vitals: simState.vitals,
        moass: simState.moass,
        eeg: simState.eegState ?? undefined,
        pkStates: simState.pkStates,
      };

      if (!hasSignificantChange(snapshot)) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const ctx: ClaudeContext = {
        patient: simState.digitalTwin
          ? {
              age: simState.digitalTwin.age,
              weight: simState.digitalTwin.weight,
              sex: simState.digitalTwin.sex,
              asa: simState.digitalTwin.asa,
              comorbidities: simState.digitalTwin.comorbidities ?? [],
              mallampati: simState.digitalTwin.mallampati,
              osa: simState.digitalTwin.osa,
              drugSensitivity: simState.digitalTwin.drugSensitivity,
            }
          : undefined,
        vitals: simState.vitals,
        moass: simState.moass,
        eeg: simState.eegState ?? undefined,
        pkStates: simState.pkStates,
        elapsedSeconds: simState.elapsedSeconds,
        recentEvents: simState.eventLog.slice(-5).map((e) => e.message),
      };

      const result = await querySimMaster(ctx, abortRef.current.signal);
      if (result) {
        setAnnotation(result);
        updateTargetPosition(result.target);
        setIsVisible(true);

        // Auto-dismiss after 8 seconds
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setAnnotation(null), 500);
        }, 8000);
      }
    }, 10000); // Evaluate every 10 seconds

    return () => {
      clearInterval(interval);
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, simState, updateTargetPosition]);

  // Update position on window resize
  useEffect(() => {
    if (!annotation) return;
    const handleResize = () => updateTargetPosition(annotation.target);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [annotation, updateTargetPosition]);

  if (!annotation || !enabled) return null;

  const severityColors = {
    info: { bg: 'bg-blue-900/90', border: 'border-blue-400', text: 'text-blue-200', glow: 'shadow-blue-500/30' },
    warning: { bg: 'bg-yellow-900/90', border: 'border-yellow-400', text: 'text-yellow-200', glow: 'shadow-yellow-500/30' },
    danger: { bg: 'bg-red-900/90', border: 'border-red-400', text: 'text-red-200', glow: 'shadow-red-500/30' },
  };

  const colors = severityColors[annotation.severity];
  const animClass = annotation.action === 'pulse'
    ? 'animate-pulse'
    : annotation.action === 'point'
    ? 'animate-bounce'
    : '';

  // Calculate callout position relative to target
  const calloutStyle: React.CSSProperties = targetRect
    ? {
        position: 'fixed',
        left: Math.min(targetRect.right + 16, window.innerWidth - 320),
        top: Math.max(targetRect.top - 10, 60),
        zIndex: 9999,
        maxWidth: 300,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }
    : {
        position: 'fixed',
        right: 80,
        top: 100,
        zIndex: 9999,
        maxWidth: 300,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      };

  // Highlight ring around target element
  const highlightStyle: React.CSSProperties | null = targetRect
    ? {
        position: 'fixed',
        left: targetRect.left - 4,
        top: targetRect.top - 4,
        width: targetRect.width + 8,
        height: targetRect.height + 8,
        zIndex: 9998,
        pointerEvents: 'none' as const,
        borderRadius: 6,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }
    : null;

  return (
    <>
      {/* Highlight ring around target */}
      {highlightStyle && (
        <div
          style={highlightStyle}
          className={`border-2 ${colors.border} ${animClass} shadow-lg ${colors.glow}`}
        />
      )}

      {/* Callout bubble */}
      <div style={calloutStyle} className="pointer-events-auto">
        <div
          className={`${colors.bg} ${colors.border} border rounded-lg px-3 py-2 shadow-xl ${colors.glow} shadow-lg`}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">SimMaster</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase ${
                  annotation.severity === 'danger'
                    ? 'bg-red-500/30 text-red-300'
                    : annotation.severity === 'warning'
                    ? 'bg-yellow-500/30 text-yellow-300'
                    : 'bg-blue-500/30 text-blue-300'
                }`}
              >
                {annotation.severity}
              </span>
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => setAnnotation(null), 300);
              }}
              className="text-gray-400 hover:text-white text-sm leading-none"
            >
              x
            </button>
          </div>

          {/* Message */}
          <p className={`text-xs ${colors.text} leading-relaxed`}>
            {annotation.message}
          </p>

          {/* Target label */}
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[9px] text-gray-500">Pointing to:</span>
            <span className="text-[9px] text-gray-400 font-mono">
              {SCREEN_REGIONS[annotation.target]?.label ?? annotation.target}
            </span>
          </div>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes simmaster-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </>
  );
};

export default SimMasterOverlay;
