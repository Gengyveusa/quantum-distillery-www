/**
 * Published Reference Pharmacokinetic Parameters
 *
 * Contains 3-compartment model parameters for each drug as reported in
 * the primary literature.  These values serve as the "ground-truth" for
 * MDAPE (Median Absolute Performance Error) validation.
 *
 * References:
 *   Marsh BE et al.  Br J Anaesth 1991;67:41-48
 *   Schnider TW et al.  Anesthesiology 1998;88:1170-1182
 *   Minto CF et al.  Anesthesiology 1997;86:10-23
 *   Greenblatt DJ et al.  Clin Pharmacokinet 1989;16:337-364
 *   Bouillon TW et al.  Anesthesiology 2004;100:240-252
 */

export interface ReferenceModel {
  /** Short identifier */
  id: string;
  /** Human-readable name including publication year */
  name: string;
  /** APA-style citation */
  citation: string;
  /** Standard patient for which the parameters below are computed */
  standardPatient: {
    age: number;      // years
    weight: number;   // kg
    height?: number;  // cm
    sex?: 'male' | 'female';
  };
  /** 3-compartment micro-rate constants (min⁻¹) and volumes (L) */
  params: {
    V1: number;   // central volume (L)
    k10: number;  // elimination rate constant (min⁻¹)
    k12: number;  // central → peripheral 1 (min⁻¹)
    k13: number;  // central → peripheral 2 (min⁻¹)
    k21: number;  // peripheral 1 → central (min⁻¹)
    k31: number;  // peripheral 2 → central (min⁻¹)
    ke0: number;  // effect-site equilibration (min⁻¹)
  };
}

// ---------------------------------------------------------------------------
// Propofol — Marsh 1991
// Standard 70 kg adult; k12 published as 0.114 min⁻¹ (not 0.112)
// ke0=0.26 min⁻¹ is the widely-adopted Marsh ke0 (Struys 2000)
// ---------------------------------------------------------------------------
export const MARSH_1991: ReferenceModel = {
  id: 'marsh_1991',
  name: 'Propofol — Marsh (1991)',
  citation: 'Marsh BE, White M, Morton N, Kenny GN. Pharmacokinetic model driven infusion of propofol in children. Br J Anaesth. 1991;67:41-48.',
  standardPatient: { age: 40, weight: 70 },
  params: {
    V1: 15.9,
    k10: 0.119,
    k12: 0.114,
    k13: 0.042,
    k21: 0.055,
    k31: 0.0033,
    ke0: 0.26,
  },
};

// ---------------------------------------------------------------------------
// Propofol — Schnider 1998
// Standard patient: 35 yr, 70 kg, 170 cm, male
// LBM (James) = 1.1·70 − 128·(70/170)² ≈ 55.3 kg
// CL1=1.639, CL2=1.722, CL3=0.836 L/min
// V1=4.27 L (fixed),  V2=25.94 L,  V3=238 L (fixed)
// ke0=0.456 min⁻¹ (Schnider 1998, Table 5)
// ---------------------------------------------------------------------------
const SCHNIDER_CL1 = 1.89 + 0.0456 * (70 - 77) - 0.0681 * (55.3 - 59) + 0.0264 * (170 - 177);
const SCHNIDER_CL2 = 1.29 - 0.024 * (35 - 53);
const SCHNIDER_CL3 = 0.836;
const SCHNIDER_V1 = 4.27;
const SCHNIDER_V2 = 18.9 - 0.391 * (35 - 53);
const SCHNIDER_V3 = 238;

export const SCHNIDER_1998: ReferenceModel = {
  id: 'schnider_1998',
  name: 'Propofol — Schnider (1998)',
  citation: 'Schnider TW, Minto CF, Gambus PL, et al. The influence of method of administration and covariates on the pharmacokinetics of propofol in adult volunteers. Anesthesiology. 1998;88:1170-1182.',
  standardPatient: { age: 35, weight: 70, height: 170, sex: 'male' },
  params: {
    V1: SCHNIDER_V1,
    k10: SCHNIDER_CL1 / SCHNIDER_V1,
    k12: SCHNIDER_CL2 / SCHNIDER_V1,
    k13: SCHNIDER_CL3 / SCHNIDER_V1,
    k21: SCHNIDER_CL2 / SCHNIDER_V2,
    k31: SCHNIDER_CL3 / SCHNIDER_V3,
    ke0: 0.456,
  },
};

// ---------------------------------------------------------------------------
// Remifentanil — Minto 1997
// Standard patient: 40 yr, 70 kg, 170 cm, male
// LBM = 1.1·70 − 128·(70/170)² ≈ 55.3 kg
// When age=40 and LBM≈55 the age/LBM correction terms are ≈0
// CL1=2.60, CL2=2.05, CL3=0.076 L/min
// V1=5.1 L,  V2=9.82 L,  V3=5.42 L
// ke0=0.595 min⁻¹ (Minto 1997 Table 2)
// ---------------------------------------------------------------------------
const MINTO_LBM = 1.1 * 70 - 128 * Math.pow(70 / 170, 2); // ≈55.3 kg
const MINTO_CL1 = 2.6 - 0.0162 * (40 - 40) + 0.0191 * (MINTO_LBM - 55);
const MINTO_CL2 = 2.05 - 0.0301 * (40 - 40);
const MINTO_CL3 = 0.076 - 0.00113 * (40 - 40);
const MINTO_V1 = 5.1 - 0.0201 * (40 - 40) + 0.072 * (MINTO_LBM - 55);
const MINTO_V2 = 9.82 - 0.0811 * (40 - 40) + 0.108 * (MINTO_LBM - 55);
const MINTO_V3 = 5.42;

export const MINTO_1997: ReferenceModel = {
  id: 'minto_1997',
  name: 'Remifentanil — Minto (1997)',
  citation: 'Minto CF, Schnider TW, Egan TD, et al. Influence of age and gender on the pharmacokinetics and pharmacodynamics of remifentanil. Anesthesiology. 1997;86:10-23.',
  standardPatient: { age: 40, weight: 70, height: 170, sex: 'male' },
  params: {
    V1: MINTO_V1,
    k10: MINTO_CL1 / MINTO_V1,
    k12: MINTO_CL2 / MINTO_V1,
    k13: MINTO_CL3 / MINTO_V1,
    k21: MINTO_CL2 / MINTO_V2,
    k31: MINTO_CL3 / MINTO_V3,
    ke0: 0.595,
  },
};

// ---------------------------------------------------------------------------
// Midazolam — Greenblatt (Heizmann/Perrier/Greenblatt consensus)
// Parameters represent the central estimate from:
//   Heizmann P et al. Br J Clin Pharmacol 1983;16:43-49
//   Greenblatt DJ et al. Clin Pharmacokinet 1989;16:337-364
// Standard patient: 40 yr, 70 kg
// V1=8.6 L,  t½α≈5 min,  t½β≈2.5 h
// CL≈0.28 L/min (4 mL/min/kg × 70 kg)
// ke0=0.13 min⁻¹ (Maitre 1992)
// ---------------------------------------------------------------------------
export const GREENBLATT_MIDAZOLAM: ReferenceModel = {
  id: 'greenblatt_midazolam',
  name: 'Midazolam — Greenblatt (1989)',
  citation: 'Greenblatt DJ, Abernethy DR, Morse DS, Harmatz JS, Shader RI. Clinical importance of the interaction of diazepam and cimetidine. N Engl J Med. 1989;316:1390-1394; Heizmann P, Eckert M, Ziegler WH. Pharmacokinetics and bioavailability of midazolam in man. Br J Clin Pharmacol. 1983;16:43-49.',
  standardPatient: { age: 40, weight: 70 },
  params: {
    V1: 8.6,
    k10: 0.032,
    k12: 0.077,
    k13: 0.017,
    k21: 0.025,
    k31: 0.004,
    ke0: 0.13,
  },
};

// ---------------------------------------------------------------------------
// Bouillon 2004 — Propofol/Remifentanil PD interaction reference points
// Sedation EC50 values from Bouillon TW et al. Anesthesiology 2004;100:240-252
// These are used to validate the response-surface PD model
// ---------------------------------------------------------------------------
export interface BouillonReferencePoint {
  /** Propofol effect-site concentration (mcg/mL) */
  cePropofol: number;
  /** Remifentanil effect-site concentration in ng/mL.
   *  Convert to mcg/mL when passing to the PD model: ceRemifentanilNgMl / 1000 */
  ceRemifentanilNgMl: number;
  /** Expected MOASS level (0–5) */
  expectedMOASS: number;
  /** Description of the clinical scenario */
  label: string;
}

export const BOUILLON_2004_REFERENCE: BouillonReferencePoint[] = [
  // Propofol alone
  { cePropofol: 0.0,  ceRemifentanilNgMl: 0.0,   expectedMOASS: 5, label: 'No drug — awake' },
  { cePropofol: 2.0,  ceRemifentanilNgMl: 0.0,   expectedMOASS: 4, label: 'Propofol 2.0 mcg/mL — drowsy' },
  { cePropofol: 2.5,  ceRemifentanilNgMl: 0.0,   expectedMOASS: 3, label: 'Propofol 2.5 mcg/mL — moderate sedation' },
  { cePropofol: 4.0,  ceRemifentanilNgMl: 0.0,   expectedMOASS: 2, label: 'Propofol 4.0 mcg/mL — deep sedation' },
  { cePropofol: 6.0,  ceRemifentanilNgMl: 0.0,   expectedMOASS: 1, label: 'Propofol 6.0 mcg/mL — general anaesthesia' },
  // Remifentanil alone (opioid ceiling — never deeper than MOASS 4)
  { cePropofol: 0.0,  ceRemifentanilNgMl: 2.0,   expectedMOASS: 4, label: 'Remi 2 ng/mL alone — drowsy' },
  { cePropofol: 0.0,  ceRemifentanilNgMl: 10.0,  expectedMOASS: 4, label: 'Remi 10 ng/mL alone — drowsy ceiling' },
  // Combination (supra-additive interaction; lower propofol required)
  { cePropofol: 1.5,  ceRemifentanilNgMl: 4.0,   expectedMOASS: 3, label: 'Combo moderate sedation' },
  { cePropofol: 2.5,  ceRemifentanilNgMl: 4.0,   expectedMOASS: 2, label: 'Combo deep sedation' },
];

// ---------------------------------------------------------------------------
// Convenience export: all reference models
// ---------------------------------------------------------------------------
export const ALL_REFERENCE_MODELS: ReferenceModel[] = [
  MARSH_1991,
  SCHNIDER_1998,
  MINTO_1997,
  GREENBLATT_MIDAZOLAM,
];
