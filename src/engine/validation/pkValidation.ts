/**
 * PK/PD Validation Helpers
 *
 * Utility functions that:
 *  1. Simulate a 3-compartment PK profile from a reference model definition
 *  2. Compare it against the SedSim engine implementation
 *  3. Return MDAPE and raw concentration arrays for comparison plots
 *
 * The "reference" simulation uses exact published parameters; the "engine"
 * simulation uses the parameters in drugs.ts.  Perfect agreement would give
 * MDAPE = 0 %.  A passing system achieves MDAPE < 20 %.
 */

import { stepPK, createInitialPKState } from '../pkModel';
import { DrugParams, PKState } from '../../types';
import { ReferenceModel } from './publishedData';
import { mdape, mdpe } from './mdape';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DosingProtocol {
  /** Bolus dose administered at time=0 (drug-native unit: mg or mcg) */
  bolusMg: number;
  /** Constant infusion rate (drug-native unit/min); 0 for bolus-only */
  infusionRatePerMin: number;
  /** Duration of infusion (min); ignored when infusionRatePerMin=0 */
  infusionDurationMin: number;
  /** Total simulation duration (min) */
  totalDurationMin: number;
  /** Integration step size (s) — default 1 s */
  dtSeconds?: number;
}

export interface ConcentrationProfile {
  /** Time points (min) */
  timesMin: number[];
  /** Central-compartment concentrations (mcg/mL or ng/mL depending on drug) */
  c1: number[];
  /** Effect-site concentrations */
  ce: number[];
}

export interface ValidationResult {
  modelName: string;
  drugName: string;
  /** MDAPE of c1 (plasma) concentrations (%) */
  mdapePlasma: number;
  /** MDAPE of ce (effect-site) concentrations (%) */
  mdapeEffectSite: number;
  /** MDPE (signed) of c1 */
  mdpePlasma: number;
  /** Time points used for comparison */
  timesMin: number[];
  /** Reference concentrations */
  referencePlasma: number[];
  referenceEffectSite: number[];
  /** Engine concentrations */
  enginePlasma: number[];
  engineEffectSite: number[];
  /** Whether MDAPE is within the 20 % acceptance criterion */
  passes: boolean;
}

// ---------------------------------------------------------------------------
// Core simulation
// ---------------------------------------------------------------------------

/**
 * Run a 3-compartment PK simulation using Euler integration.
 *
 * @param params  Drug parameters (V1, k10-k31, ke0)
 * @param dosing  Dosing protocol
 * @param sampleTimesMin  Time points at which to record concentrations (min)
 */
export function simulatePK(
  params: DrugParams | ReferenceModel['params'],
  dosing: DosingProtocol,
  sampleTimesMin: number[]
): ConcentrationProfile {
  const dt = dosing.dtSeconds ?? 1; // seconds
  const totalSteps = Math.ceil(dosing.totalDurationMin * 60 / dt);

  // Build a DrugParams-compatible object
  const drug: DrugParams = {
    name: 'validation',
    color: '#000',
    V1: params.V1,
    k10: params.k10,
    k12: params.k12,
    k13: params.k13,
    k21: params.k21,
    k31: params.k31,
    ke0: params.ke0,
    EC50: 1,     // not used for PK
    gamma: 1,    // not used for PK
    unit: 'mg',
  };

  let state: PKState = createInitialPKState();
  const sampleSet = new Set(sampleTimesMin.map(t => Math.round(t * 60))); // in seconds

  const result: ConcentrationProfile = { timesMin: [], c1: [], ce: [] };

  for (let step = 0; step <= totalSteps; step++) {
    const timeS = step * dt;

    // Bolus at t=0
    const bolus = step === 0 ? dosing.bolusMg : 0;

    // Infusion (stop after infusionDurationMin)
    const infusion =
      dosing.infusionRatePerMin > 0 && timeS / 60 < dosing.infusionDurationMin
        ? dosing.infusionRatePerMin
        : 0;

    state = stepPK(state, drug, bolus, infusion, dt);

    if (sampleSet.has(Math.round(timeS))) {
      result.timesMin.push(timeS / 60);
      result.c1.push(state.c1);
      result.ce.push(state.ce);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// MDAPE comparison
// ---------------------------------------------------------------------------

/**
 * Validate the SedSim engine implementation against a published reference model.
 *
 * Both simulations are run with the same dosing protocol.  The reference uses
 * exact published parameters; the engine uses engineDrugParams (from drugs.ts).
 */
export function validatePKModel(
  referenceModel: ReferenceModel,
  engineDrugParams: DrugParams,
  dosing: DosingProtocol,
  sampleTimesMin: number[]
): ValidationResult {
  const ref = simulatePK(referenceModel.params, dosing, sampleTimesMin);
  const eng = simulatePK(engineDrugParams, dosing, sampleTimesMin);

  // Filter to non-zero reference concentrations (avoid divide-by-zero at t=0)
  // c1 is 0 before any drug is administered; 1e-10 threshold excludes only exact zeros
  const indices = ref.c1
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => c > 1e-10)
    .map(({ i }) => i);

  const refPlasma = indices.map(i => ref.c1[i]);
  const engPlasma = indices.map(i => eng.c1[i]);
  const refCe     = indices.map(i => ref.ce[i]);
  const engCe     = indices.map(i => eng.ce[i]);

  const mdapePlasma     = mdape(refPlasma, engPlasma);
  const mdapeEffectSite = mdape(refCe, engCe);
  const mdpePlasma      = mdpe(refPlasma, engPlasma);

  return {
    modelName: referenceModel.name,
    drugName: engineDrugParams.name,
    mdapePlasma,
    mdapeEffectSite,
    mdpePlasma,
    timesMin: sampleTimesMin,
    referencePlasma:    ref.c1,
    referenceEffectSite: ref.ce,
    enginePlasma:       eng.c1,
    engineEffectSite:   eng.ce,
    passes: mdapePlasma < 20,
  };
}

// ---------------------------------------------------------------------------
// Standard dosing protocols for each drug class
// ---------------------------------------------------------------------------

/** 200 mg propofol bolus (typical induction dose) with 60-min observation */
export const PROPOFOL_BOLUS_PROTOCOL: DosingProtocol = {
  bolusMg: 200,
  infusionRatePerMin: 0,
  infusionDurationMin: 0,
  totalDurationMin: 60,
};

/** 10 mg/min propofol infusion for 10 min, then 50-min washout */
export const PROPOFOL_INFUSION_PROTOCOL: DosingProtocol = {
  bolusMg: 0,
  infusionRatePerMin: 10,
  infusionDurationMin: 10,
  totalDurationMin: 60,
};

/** 200 mcg remifentanil bolus with 30-min observation */
export const REMIFENTANIL_BOLUS_PROTOCOL: DosingProtocol = {
  bolusMg: 200,
  infusionRatePerMin: 0,
  infusionDurationMin: 0,
  totalDurationMin: 30,
};

/** 5 mg midazolam bolus with 120-min observation */
export const MIDAZOLAM_BOLUS_PROTOCOL: DosingProtocol = {
  bolusMg: 5,
  infusionRatePerMin: 0,
  infusionDurationMin: 0,
  totalDurationMin: 120,
};

/** Standard sample times for comparison (min) */
export const STANDARD_SAMPLE_TIMES_MIN = [
  1, 2, 3, 5, 7, 10, 15, 20, 30, 45, 60,
];

export const REMI_SAMPLE_TIMES_MIN = [
  1, 2, 3, 5, 7, 10, 15, 20, 30,
];

export const MIDAZOLAM_SAMPLE_TIMES_MIN = [
  1, 2, 5, 10, 15, 20, 30, 45, 60, 90, 120,
];
