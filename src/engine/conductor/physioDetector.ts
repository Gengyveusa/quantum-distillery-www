/**
 * src/engine/conductor/physioDetector.ts
 * Conductor Core — Physiology Event Detector
 *
 * Migrated and focused version of the SimMaster detectEvents() function.
 * Only retains the five clinically critical event classes required by the
 * Conductor specification:
 *   • desaturation  (SpO2 < 94 with falling trend)
 *   • bradycardia   (HR < 50)
 *   • hypotension   (SBP < 90 or MAP < 65)
 *   • respiratory_depression  (RR < 8)
 *   • tachycardia   (HR > 110)
 *
 * When a new event is detected it creates ad-hoc Beats that can be injected
 * into the beat queue by the Conductor.
 *
 * All other SimMaster events (drug_onset, EEG transitions, etc.) are left in
 * simMaster.ts until the full merge in Phase 4.
 */

import type { Vitals, MOASSLevel } from '../../types';
import type { Beat } from './types';

export type PhysioEventName =
  | 'desaturation'
  | 'bradycardia'
  | 'hypotension'
  | 'respiratory_depression'
  | 'tachycardia'
  | 'deep_sedation';

export interface PhysioEvent {
  name: PhysioEventName;
  data: Record<string, unknown>;
  timestamp: number;
  /** Auto-generated ad-hoc beats to inject into the beat queue. */
  beats: Beat[];
}

// ─── Internal detection state ─────────────────────────────────────────────────

interface PhysioDetectorState {
  prevVitals: Vitals;
  lastEventTimes: Partial<Record<PhysioEventName, number>>;
}

/** Minimum time (ms) between repeated firings of the same event type. */
const COOLDOWN_MS: Record<PhysioEventName, number> = {
  desaturation:          15_000,
  bradycardia:           20_000,
  hypotension:           20_000,
  respiratory_depression: 20_000,
  tachycardia:           20_000,
  deep_sedation:         30_000,
};

let state: PhysioDetectorState | null = null;

/** Reset the detector (call on scenario start / sim reset). */
export function resetPhysioDetector(): void {
  state = null;
}

/**
 * Run the detector against the current vitals snapshot.
 * Returns an array of PhysioEvent objects (may be empty).
 */
export function detectPhysioEvents(
  vitals: Vitals,
  moass: MOASSLevel
): PhysioEvent[] {
  const now = Date.now();

  if (!state) {
    state = {
      prevVitals: { ...vitals },
      lastEventTimes: {},
    };
    return [];
  }

  const events: PhysioEvent[] = [];

  const cooldownOk = (name: PhysioEventName): boolean => {
    const last = state!.lastEventTimes[name] ?? 0;
    return now - last >= COOLDOWN_MS[name];
  };

  const push = (
    name: PhysioEventName,
    data: Record<string, unknown>,
    beats: Beat[]
  ): void => {
    events.push({ name, data, timestamp: now, beats });
    state!.lastEventTimes[name] = now;
  };

  // ── Desaturation ─────────────────────────────────────────────────────────
  if (cooldownOk('desaturation')) {
    const spo2Falling =
      vitals.spo2 < 94 && vitals.spo2 < state.prevVitals.spo2 - 1;
    if (spo2Falling) {
      push(
        'desaturation',
        { spo2: vitals.spo2, rr: vitals.rr, etco2: vitals.etco2 },
        [
          makeBeat('desaturation', 0, {
            millie: `⚠️ SpO₂ dropping to ${Math.round(vitals.spo2)}% — consider jaw thrust, supplemental O₂, or stimulating the patient.`,
            callout: {
              targetId: 'spo2_display',
              text: `SpO₂ ${Math.round(vitals.spo2)}%`,
              vitalLabel: 'SpO₂',
              vitalValue: Math.round(vitals.spo2),
              severity: vitals.spo2 < 88 ? 'danger' : 'warning',
            },
          }),
        ]
      );
    }
  }

  // ── Bradycardia ───────────────────────────────────────────────────────────
  if (cooldownOk('bradycardia') && vitals.hr < 50) {
    push(
      'bradycardia',
      { hr: vitals.hr },
      [
        makeBeat('bradycardia', 0, {
          millie: `⚠️ Bradycardia — HR ${Math.round(vitals.hr)} bpm. Assess depth of sedation and consider atropine if clinically indicated.`,
          callout: {
            targetId: 'hr_display',
            text: `HR ${Math.round(vitals.hr)} bpm`,
            vitalLabel: 'HR',
            vitalValue: Math.round(vitals.hr),
            severity: vitals.hr < 40 ? 'danger' : 'warning',
          },
        }),
      ]
    );
  }

  // ── Hypotension ───────────────────────────────────────────────────────────
  if (cooldownOk('hypotension')) {
    const sbpLow = vitals.sbp < 90;
    const mapLow = (vitals.map ?? 999) < 65;
    if (sbpLow || mapLow) {
      push(
        'hypotension',
        { sbp: vitals.sbp, map: vitals.map },
        [
          makeBeat('hypotension', 0, {
            millie: `⚠️ Hypotension — SBP ${Math.round(vitals.sbp)} mmHg${vitals.map ? `, MAP ${Math.round(vitals.map)} mmHg` : ''}. Consider IV fluid bolus or vasopressors.`,
            callout: {
              targetId: 'bp_display',
              text: `SBP ${Math.round(vitals.sbp)} mmHg`,
              vitalLabel: 'SBP',
              vitalValue: Math.round(vitals.sbp),
              severity: vitals.sbp < 75 ? 'danger' : 'warning',
            },
          }),
        ]
      );
    }
  }

  // ── Respiratory Depression ────────────────────────────────────────────────
  if (cooldownOk('respiratory_depression') && vitals.rr < 8) {
    push(
      'respiratory_depression',
      { rr: vitals.rr, etco2: vitals.etco2 },
      [
        makeBeat('respiratory_depression', 0, {
          millie: `⚠️ Respiratory depression — RR ${Math.round(vitals.rr)}/min. Stimulate, reposition airway, reduce sedation depth.`,
          callout: {
            targetId: 'rr_display',
            text: `RR ${Math.round(vitals.rr)}/min`,
            vitalLabel: 'RR',
            vitalValue: Math.round(vitals.rr),
            severity: vitals.rr < 5 ? 'danger' : 'warning',
          },
        }),
      ]
    );
  }

  // ── Tachycardia ───────────────────────────────────────────────────────────
  if (cooldownOk('tachycardia') && vitals.hr > 110) {
    push(
      'tachycardia',
      { hr: vitals.hr },
      [
        makeBeat('tachycardia', 0, {
          millie: `ℹ️ Tachycardia — HR ${Math.round(vitals.hr)} bpm. Check for inadequate sedation, pain, or hypovolaemia.`,
          callout: {
            targetId: 'hr_display',
            text: `HR ${Math.round(vitals.hr)} bpm`,
            vitalLabel: 'HR',
            vitalValue: Math.round(vitals.hr),
            severity: vitals.hr > 130 ? 'danger' : 'warning',
          },
        }),
      ]
    );
  }

  // ── Deep sedation (MOASS 0 — unresponsive) ────────────────────────────────
  if (cooldownOk('deep_sedation') && moass === 0) {
    push(
      'deep_sedation',
      { moass },
      [
        makeBeat('deep_sedation', 0, {
          millie: `🔴 MOASS 0 — patient unresponsive. Assess airway, stimulate, and consider reversal agents if clinically appropriate.`,
          callout: {
            targetId: 'moass_gauge',
            text: 'MOASS 0 — Unresponsive',
            vitalLabel: 'MOASS',
            vitalValue: 0,
            severity: 'danger',
          },
        }),
      ]
    );
  }

  // ── Update previous vitals ────────────────────────────────────────────────
  state.prevVitals = { ...vitals };

  return events;
}

// ─── Beat factory ─────────────────────────────────────────────────────────────

interface AdHocBeatOptions {
  millie?: string;
  callout?: Beat['callout'];
}

let beatSeq = 0;

function makeBeat(
  eventName: PhysioEventName,
  delayMs: number,
  opts: AdHocBeatOptions
): Beat {
  beatSeq += 1;
  const id = `physio_${eventName}_${beatSeq}`;

  if (opts.callout && opts.millie) {
    // Return a millie beat; callout is handled by the Conductor which injects
    // both a millie beat and a callout beat for compound events.
    return {
      id,
      type: 'millie',
      delayMs,
      millieText: opts.millie,
      callout: opts.callout, // Conductor reads this to fire a paired callout beat.
    };
  }
  if (opts.millie) {
    return { id, type: 'millie', delayMs, millieText: opts.millie };
  }
  if (opts.callout) {
    return { id: `${id}_callout`, type: 'callout', delayMs, callout: opts.callout };
  }
  return { id, type: 'pause', delayMs };
}
