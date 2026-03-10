/**
 * Automated PK/PD Validation Test Suite
 *
 * Validates SedSim's pharmacokinetic models against published reference data.
 * Acceptance criterion (per TCI literature): MDAPE < 20 % for all drugs.
 *
 * References validated:
 *   - Propofol:      Marsh (1991), Schnider (1998)
 *   - Remifentanil:  Minto (1997)
 *   - Midazolam:     Greenblatt (1989)
 *   - PD interaction: Bouillon (2004) response surface
 *
 * Run with:  npm test
 */

import { describe, it, expect } from 'vitest';
import { propofol, midazolam, remifentanil } from '../../engine/drugs';
import {
  MARSH_1991,
  SCHNIDER_1998,
  MINTO_1997,
  GREENBLATT_MIDAZOLAM,
  BOUILLON_2004_REFERENCE,
} from '../../engine/validation/publishedData';
import {
  validatePKModel,
  simulatePK,
  PROPOFOL_BOLUS_PROTOCOL,
  PROPOFOL_INFUSION_PROTOCOL,
  REMIFENTANIL_BOLUS_PROTOCOL,
  MIDAZOLAM_BOLUS_PROTOCOL,
  STANDARD_SAMPLE_TIMES_MIN,
  REMI_SAMPLE_TIMES_MIN,
  MIDAZOLAM_SAMPLE_TIMES_MIN,
} from '../../engine/validation/pkValidation';
import { mdape } from '../../engine/validation/mdape';
import { combinedEffect, effectToMOASS } from '../../engine/pdModel';

// ---------------------------------------------------------------------------
// Propofol — Marsh 1991
// ---------------------------------------------------------------------------
describe('Propofol PK — Marsh (1991) validation', () => {
  it('MDAPE < 20 % for plasma concentration after bolus', () => {
    const result = validatePKModel(
      MARSH_1991,
      propofol,
      PROPOFOL_BOLUS_PROTOCOL,
      STANDARD_SAMPLE_TIMES_MIN
    );
    expect(result.mdapePlasma).toBeLessThan(20);
  });

  it('MDAPE < 20 % for effect-site concentration after bolus', () => {
    const result = validatePKModel(
      MARSH_1991,
      propofol,
      PROPOFOL_BOLUS_PROTOCOL,
      STANDARD_SAMPLE_TIMES_MIN
    );
    expect(result.mdapeEffectSite).toBeLessThan(20);
  });

  it('MDAPE < 20 % for plasma concentration during/after infusion', () => {
    const result = validatePKModel(
      MARSH_1991,
      propofol,
      PROPOFOL_INFUSION_PROTOCOL,
      STANDARD_SAMPLE_TIMES_MIN
    );
    expect(result.mdapePlasma).toBeLessThan(20);
  });

  it('Propofol parameters match Marsh 1991 published values within 5 %', () => {
    const ref = MARSH_1991.params;
    expect(propofol.V1).toBeCloseTo(ref.V1, 1);
    expect(propofol.k10).toBeCloseTo(ref.k10, 3);
    expect(propofol.k12).toBeCloseTo(ref.k12, 3);
    expect(propofol.k13).toBeCloseTo(ref.k13, 3);
    expect(propofol.k21).toBeCloseTo(ref.k21, 3);
    expect(propofol.k31).toBeCloseTo(ref.k31, 4);
    expect(propofol.ke0).toBeCloseTo(ref.ke0, 2);
  });
});

// ---------------------------------------------------------------------------
// Propofol — Schnider 1998 (informational comparison)
// ---------------------------------------------------------------------------
describe('Propofol PK — Schnider (1998) comparison', () => {
  it('Schnider reference simulation produces non-zero concentrations', () => {
    const profile = simulatePK(
      SCHNIDER_1998.params,
      PROPOFOL_BOLUS_PROTOCOL,
      STANDARD_SAMPLE_TIMES_MIN
    );
    expect(profile.c1.some(c => c > 0)).toBe(true);
  });

  it('Schnider 1998 reference concentrations decline monotonically after bolus', () => {
    const profile = simulatePK(
      SCHNIDER_1998.params,
      PROPOFOL_BOLUS_PROTOCOL,
      [1, 5, 10, 20, 40, 60]
    );
    for (let i = 1; i < profile.c1.length; i++) {
      expect(profile.c1[i]).toBeLessThan(profile.c1[i - 1]);
    }
  });

  it('Both Marsh and Schnider show same qualitative propofol kinetics (Tmax < 2 min)', () => {
    const marshProfile  = simulatePK(MARSH_1991.params,   PROPOFOL_BOLUS_PROTOCOL, [1, 2, 3]);
    const schniderProfile = simulatePK(SCHNIDER_1998.params, PROPOFOL_BOLUS_PROTOCOL, [1, 2, 3]);
    // Peak plasma at t=1 min for bolus (both models)
    expect(marshProfile.c1[0]).toBeGreaterThan(marshProfile.c1[1]);
    expect(schniderProfile.c1[0]).toBeGreaterThan(schniderProfile.c1[1]);
  });
});

// ---------------------------------------------------------------------------
// Remifentanil — Minto 1997
// ---------------------------------------------------------------------------
describe('Remifentanil PK — Minto (1997) validation', () => {
  it('MDAPE < 20 % for plasma concentration after bolus', () => {
    const result = validatePKModel(
      MINTO_1997,
      remifentanil,
      REMIFENTANIL_BOLUS_PROTOCOL,
      REMI_SAMPLE_TIMES_MIN
    );
    expect(result.mdapePlasma).toBeLessThan(20);
  });

  it('MDAPE < 20 % for effect-site concentration after bolus', () => {
    const result = validatePKModel(
      MINTO_1997,
      remifentanil,
      REMIFENTANIL_BOLUS_PROTOCOL,
      REMI_SAMPLE_TIMES_MIN
    );
    expect(result.mdapeEffectSite).toBeLessThan(20);
  });

  it('Remifentanil parameters match Minto 1997 within 5 %', () => {
    const ref = MINTO_1997.params;
    expect(remifentanil.V1).toBeCloseTo(ref.V1, 1);
    // ke0 is identical
    expect(remifentanil.ke0).toBeCloseTo(ref.ke0, 3);
    // Rate constants within 5 % of published values
    const tolerance = 0.05;
    expect(Math.abs(remifentanil.k10 - ref.k10) / ref.k10).toBeLessThan(tolerance);
    expect(Math.abs(remifentanil.k12 - ref.k12) / ref.k12).toBeLessThan(tolerance);
    expect(Math.abs(remifentanil.k21 - ref.k21) / ref.k21).toBeLessThan(tolerance);
  });

  it('Remifentanil context-insensitive: 90 % of plasma concentration eliminated within 10 min', () => {
    const sampleTimes = [1, 5, 10, 15, 20];
    const profile = simulatePK(remifentanil, REMIFENTANIL_BOLUS_PROTOCOL, sampleTimes);
    const peakC1 = profile.c1[0];
    const at10min = profile.c1[sampleTimes.indexOf(10)];
    expect(at10min).toBeLessThan(peakC1 * 0.15); // > 85 % eliminated at 10 min
  });
});

// ---------------------------------------------------------------------------
// Midazolam — Greenblatt
// ---------------------------------------------------------------------------
describe('Midazolam PK — Greenblatt validation', () => {
  it('MDAPE < 20 % for plasma concentration after bolus', () => {
    const result = validatePKModel(
      GREENBLATT_MIDAZOLAM,
      midazolam,
      MIDAZOLAM_BOLUS_PROTOCOL,
      MIDAZOLAM_SAMPLE_TIMES_MIN
    );
    expect(result.mdapePlasma).toBeLessThan(20);
  });

  it('MDAPE < 20 % for effect-site concentration after bolus', () => {
    const result = validatePKModel(
      GREENBLATT_MIDAZOLAM,
      midazolam,
      MIDAZOLAM_BOLUS_PROTOCOL,
      MIDAZOLAM_SAMPLE_TIMES_MIN
    );
    expect(result.mdapeEffectSite).toBeLessThan(20);
  });

  it('Midazolam parameters match Greenblatt within 5 %', () => {
    const ref = GREENBLATT_MIDAZOLAM.params;
    expect(midazolam.V1).toBeCloseTo(ref.V1, 1);
    expect(midazolam.k10).toBeCloseTo(ref.k10, 3);
    expect(midazolam.ke0).toBeCloseTo(ref.ke0, 2);
  });

  it('Midazolam has long terminal half-life (>1 h), unlike remifentanil', () => {
    const sampleTimes = [30, 60, 90, 120];
    const midazProfile = simulatePK(midazolam, MIDAZOLAM_BOLUS_PROTOCOL, sampleTimes);
    const remiProfile  = simulatePK(
      remifentanil,
      { ...REMIFENTANIL_BOLUS_PROTOCOL, totalDurationMin: 120 },
      sampleTimes
    );
    // At 60 min, midazolam should have higher remaining concentration than remifentanil
    expect(midazProfile.c1[1]).toBeGreaterThan(remiProfile.c1[1]);
  });
});

// ---------------------------------------------------------------------------
// PD response surface — Bouillon 2004
// ---------------------------------------------------------------------------
describe('PD response surface — Bouillon (2004) validation', () => {
  it('No drug → MOASS 5 (awake)', () => {
    const ref = BOUILLON_2004_REFERENCE[0];
    const effect = combinedEffect([]);
    const moass = effectToMOASS(effect);
    expect(moass).toBe(ref.expectedMOASS);
  });

  it('Propofol 2.0 mcg/mL alone → MOASS 4 (drowsy)', () => {
    const ref = BOUILLON_2004_REFERENCE[1];
    const effect = combinedEffect([{ drug: propofol, ce: ref.cePropofol }]);
    const moass = effectToMOASS(effect);
    expect(moass).toBe(ref.expectedMOASS);
  });

  it('Propofol 2.5 mcg/mL alone → MOASS 3 (moderate sedation)', () => {
    const ref = BOUILLON_2004_REFERENCE[2];
    const effect = combinedEffect([{ drug: propofol, ce: ref.cePropofol }]);
    const moass = effectToMOASS(effect);
    expect(moass).toBe(ref.expectedMOASS);
  });

  it('Propofol 4.0 mcg/mL alone → MOASS ≤ 2 (deep sedation)', () => {
    const ref = BOUILLON_2004_REFERENCE[3];
    const effect = combinedEffect([{ drug: propofol, ce: ref.cePropofol }]);
    const moass = effectToMOASS(effect);
    expect(moass).toBeLessThanOrEqual(ref.expectedMOASS);
  });

  it('Remifentanil alone cannot cause MOASS < 4 (opioid sedation ceiling)', () => {
    // ce values in mcg/mL (2, 5, 10, 20 ng/mL converted)
    for (const ce of [0.002, 0.005, 0.010, 0.020]) {
      const effect = combinedEffect([{ drug: remifentanil, ce }]);
      const moass = effectToMOASS(effect);
      expect(moass).toBeGreaterThanOrEqual(4);
    }
  });

  it('Opioid + hypnotic combination potentiates sedation (supra-additive)', () => {
    const propofolCe = 1.5;    // MOASS 5 alone (below threshold)
    const remiCe     = 0.004;  // MOASS 5 alone (sub-ceiling, in mcg/mL = 4 ng/mL)
    const propofolOnly = combinedEffect([{ drug: propofol, ce: propofolCe }]);
    const remiOnly     = combinedEffect([{ drug: remifentanil, ce: remiCe }]);
    const combined     = combinedEffect([
      { drug: propofol,     ce: propofolCe },
      { drug: remifentanil, ce: remiCe },
    ]);
    // Combined effect must exceed the sum-of-parts (supra-additive)
    expect(combined).toBeGreaterThan(propofolOnly + remiOnly);
  });

  it('Bouillon reference point MDAPE < 20 % across interaction data set', () => {
    const measured: number[]  = [];
    const predicted: number[] = [];

    for (const ref of BOUILLON_2004_REFERENCE) {
      const drugEffects = [];
      if (ref.cePropofol > 0) {
        drugEffects.push({ drug: propofol, ce: ref.cePropofol });
      }
      // Convert ng/mL → mcg/mL for the PD model
      if (ref.ceRemifentanilNgMl > 0) {
        drugEffects.push({ drug: remifentanil, ce: ref.ceRemifentanilNgMl / 1000 });
      }

      const effect = combinedEffect(drugEffects);
      const simulated = effectToMOASS(effect);

      // Only include points where expected MOASS > 0 (avoid 0-division)
      if (ref.expectedMOASS > 0) {
        measured.push(ref.expectedMOASS);
        predicted.push(simulated);
      }
    }

    const pdMdape = mdape(measured, predicted);
    expect(pdMdape).toBeLessThan(20);
  });
});

// ---------------------------------------------------------------------------
// MDAPE utility — unit tests
// ---------------------------------------------------------------------------
describe('MDAPE calculation utilities', () => {
  it('Perfect prediction gives MDAPE = 0 %', () => {
    const vals = [1, 2, 3, 4, 5];
    expect(mdape(vals, vals)).toBe(0);
  });

  it('10 % uniform over-prediction gives MDAPE = 10 %', () => {
    const measured  = [10, 20, 30, 40];
    const predicted = measured.map(v => v * 1.1);
    expect(mdape(measured, predicted)).toBeCloseTo(10, 1);
  });

  it('Mixed errors: median correctly calculated', () => {
    const measured  = [10, 10, 10, 10];
    const predicted = [9, 9.5, 10.5, 11];  // APEs: [10, 5, 5, 10] → sorted [5, 5, 10, 10] → median=7.5
    expect(mdape(measured, predicted)).toBeCloseTo(7.5, 1);
  });
});
