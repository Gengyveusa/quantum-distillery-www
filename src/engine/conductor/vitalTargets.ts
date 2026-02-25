/**
 * src/engine/conductor/vitalTargets.ts
 * Conductor Core — Vital Target Interpolation
 *
 * Provides helpers that, given scenario-defined StepVitalTargets, nudge the
 * simulation state toward the target values. Operates through useSimStore's
 * overrideVital() action so the physiology model can "converge" toward
 * scenario-scripted vital values over time.
 *
 * The interpolation is intentionally gentle — each tick moves the current
 * vital only a fraction of the remaining distance to the target, producing
 * a realistic drift rather than a hard jump.
 */

import type { StepVitalTargets } from './types';

/** How aggressively to interpolate toward the target per second (0–1). */
const DEFAULT_ALPHA = 0.05;

export interface VitalTargetContext {
  /** Current vitals snapshot from useSimStore. */
  currentVitals: {
    spo2: number;
    hr: number;
    sbp: number;
    rr: number;
    etco2: number;
  };
  /** Patient PK/PD sensitivity modifier from the archetype (1.0 = baseline). */
  pkPdSensitivity: number;
  /** Elapsed scenario seconds — used to gate how quickly targets are approached. */
  elapsedSeconds: number;
}

export interface VitalOverride {
  parameter: string;
  value: number;
}

/**
 * Compute the set of vital overrides needed to move current vitals one step
 * closer to the scenario targets.
 *
 * Returns only the parameters that need adjustment; callers should apply them
 * via useSimStore.getState().overrideVital().
 */
export function computeVitalOverrides(
  targets: StepVitalTargets,
  ctx: VitalTargetContext
): VitalOverride[] {
  const overrides: VitalOverride[] = [];

  // Use the scenario's sensitivity modifier (if provided) to scale alpha.
  const sensitivityScale =
    targets.pkPdSensitivity !== undefined
      ? targets.pkPdSensitivity
      : ctx.pkPdSensitivity;
  const alpha = clamp(DEFAULT_ALPHA * sensitivityScale, 0.01, 0.3);

  const check = (
    param: keyof typeof ctx.currentVitals,
    target: number | undefined
  ): void => {
    if (target === undefined) return;
    const current = ctx.currentVitals[param];
    const delta = target - current;
    // Only emit an override if the gap is large enough to warrant it.
    if (Math.abs(delta) < 0.5) return;
    const newValue = current + delta * alpha;
    overrides.push({ parameter: param, value: round(newValue) });
  };

  check('spo2', targets.spo2);
  check('hr', targets.hr);
  check('sbp', targets.sbp);
  check('rr', targets.rr);
  check('etco2', targets.etco2);

  return overrides;
}

/**
 * Apply a set of VitalOverrides to the simulation store.
 * This is the integration point between vitalTargets and useSimStore.
 *
 * @param overrides  Array of override objects from computeVitalOverrides().
 * @param overrideFn The overrideVital action from useSimStore.
 */
export function applyVitalOverrides(
  overrides: VitalOverride[],
  overrideFn: (parameter: string, value: number) => void
): void {
  for (const o of overrides) {
    overrideFn(o.parameter, o.value);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
