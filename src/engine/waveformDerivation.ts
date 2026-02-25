// =================================================================
// src/engine/waveformDerivation.ts
// Pure function: CV + respiratory state -> waveform rendering params
// Provides ECG, pleth, and capnography parameters for waveform components
// Called once per tick inside simulationTick.ts
// =================================================================

import type {
  CardiovascularState, RespiratoryState, WaveformParams
} from '../types/SimulationState';
import type { CardiacRhythm } from '../types';

export function deriveWaveformParams(
  cv: CardiovascularState,
  resp: RespiratoryState
): WaveformParams {
  const hr = cv.hr;
  const rhythm = cv.rhythm;

  // ---- ECG Parameters ----
  // PR interval: prolonged with bradycardia or AV block patterns
  const basePR = 0.16; // seconds
  const prInterval = rhythm === 'first_degree_av_block'
    ? 0.28
    : rhythm === 'second_degree_av_block_type1'
      ? 0.24 + Math.random() * 0.08
      : basePR;

  // QRS width: wide in bundle branch blocks, VT
  const wideQRS: CardiacRhythm[] = [
    'ventricular_tachycardia', 'polymorphic_vt',
    'ventricular_fibrillation', 'paced'
  ] as CardiacRhythm[];
  const qrsWidth = wideQRS.includes(rhythm) ? 0.14 : 0.08;

  // QT interval: rate-corrected (Bazett approximation)
  const rrInterval = hr > 0 ? 60 / hr : 1;
  const qtInterval = Math.min(0.5, 0.38 * Math.sqrt(rrInterval));

  // ST deviation: depression with ischemia / tachycardia
  const stDeviation = hr > 140 ? -0.1 * ((hr - 140) / 60) : 0;

  // T-wave inversion: ischemia or electrolyte disturbances
  const tWaveInversion = cv.rhythmIsLethal || hr > 160;

  // ---- Plethysmography (SpO2 waveform) ----
  // Amplitude drops with hypotension and vasoconstriction
  const mapNorm = Math.max(0, Math.min(1, cv.map / 93));
  const plethAmplitude = Math.max(0.05, mapNorm * (1 - resp.vqMismatch * 0.3));
  const dampened = cv.map < 55 || cv.svr > 1800;
  const dicroticNotch = cv.map > 50 && !dampened;

  // ---- Capnography ----
  const etco2 = resp.etco2;
  const rr = resp.rr;
  const plateau = !resp.isApneic && resp.airwayPatency > 0.5;

  let capnoShape: 'normal' | 'obstructive' | 'rebreathing' | 'absent' = 'normal';
  if (resp.isApneic || rr === 0) {
    capnoShape = 'absent';
  } else if (resp.airwayPatency < 0.4) {
    capnoShape = 'obstructive';
  } else if (resp.deadSpaceFraction > 0.5) {
    capnoShape = 'rebreathing';
  }

  return {
    ecg: {
      rhythm,
      hr,
      prInterval,
      qrsWidth,
      qtInterval,
      stDeviation,
      tWaveInversion,
    },
    pleth: {
      amplitude: plethAmplitude,
      rate: hr,
      dicroticNotch,
      dampened,
    },
    capnography: {
      etco2,
      rr,
      plateau,
      shape: capnoShape,
    },
  };
}
