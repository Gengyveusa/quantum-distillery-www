// =================================================================
// src/engine/simulationTick.ts
// Pure function: takes current state, returns complete next state.
// NO side effects. Fully testable. Called once per frame.
// =================================================================

import type { PKState, Vitals, MOASSLevel, LogEntry, Patient, TrendPoint,
  DrugParams, InfusionState, AirwayDevice, CardiacRhythm } from '../types';
import type {
  TickResult, DerivedState, DrugPKSnapshot, PharmacodynamicState,
  PhysiologyState, RespiratoryState, CardiovascularState,
  VitalsDisplay, SimAlarm, IVFluidState
} from '../types/SimulationState';
import type { EEGState } from './eegModel';
import type { DigitalTwin } from './digitalTwin';

import { DRUG_DATABASE } from './drugs';
import { stepPK } from './pkModel';
import { combinedEffect, effectToMOASS, hillEffect } from './pdModel';
import { calculateVitals, checkAlarms, BASELINE_VITALS } from './physiology';
import { generateEEG } from './eegModel';
import { createDigitalTwin, updateTwin } from './digitalTwin';
import { deriveAvatarParams } from './avatarDerivation';
import { deriveRadarAxes } from './radarDerivation';
import { derivePetalsGauges } from './petalsDerivation';
import { deriveFrankStarling } from './frankStarlingDerivation';
import { deriveWaveformParams } from './waveformDerivation';
import { buildMillieContext } from './millieDerivation';

// --- Hill equation helper for PD sub-calculations ---
function hill(c: number, ec50: number, gamma: number): number {
  if (c <= 0 || ec50 <= 0) return 0;
  return Math.pow(c, gamma) / (Math.pow(ec50, gamma) + Math.pow(c, gamma));
}

// --- Per-drug PD contribution helpers ---

function computeAnalgesiaLevel(pkStates: Record<string, PKState>): number {
  const fentCe = pkStates['fentanyl']?.ce || 0;
  const ketCe = pkStates['ketamine']?.ce || 0;
  // Fentanyl: Ce in ng/mL (already from PK), analgesia EC50 ~1.5 ng/mL
  // Ketamine: Ce in mcg/mL, analgesia EC50 ~0.15 mcg/mL
  return Math.min(1, hill(fentCe, 1.5, 2.5) + hill(ketCe, 0.15, 1.5) * 0.6);
}

function computeAmnesiaLevel(pkStates: Record<string, PKState>): number {
  const midCe = pkStates['midazolam']?.ce || 0;
  const propCe = pkStates['propofol']?.ce || 0;
  return Math.min(1, hill(midCe * 1000, 50, 3) + hill(propCe, 2, 2) * 0.8);
}

function computeAnxiolysisLevel(pkStates: Record<string, PKState>): number {
  const midCe = pkStates['midazolam']?.ce || 0;
  const dexCe = pkStates['dexmedetomidine']?.ce || 0;
  return Math.min(1, hill(midCe * 1000, 30, 2) + hill(dexCe, 0.4, 2));
}

function computeDrugContributions(pkStates: Record<string, PKState>): Record<string, {
  sedation: number; analgesia: number;
  respiratoryDepression: number; cardiovascularDepression: number;
}> {
  const result: Record<string, any> = {};

  for (const [name, state] of Object.entries(pkStates)) {
    const ce = state.ce;
    const drug = DRUG_DATABASE[name];
    if (!drug) { result[name] = { sedation: 0, analgesia: 0, respiratoryDepression: 0, cardiovascularDepression: 0 }; continue; }

    const sedation = hill(ce, drug.EC50, drug.gamma);
    let analgesia = 0, respDep = 0, cvDep = 0;

    switch (drug.name) {
      case 'Fentanyl':
        analgesia = hill(ce, 1.5, 2.5);
        respDep = hill(ce, 3.5, 1.8) * 0.6;
        cvDep = hill(ce, 4.0, 1.5) * 0.12;
        break;
      case 'Propofol':
        respDep = hill(ce, 4.0, 2.0) * 0.4;
        cvDep = hill(ce, 3.4, 2.0) * 0.25;
        break;
      case 'Midazolam':
        respDep = hill(ce * 1000, 200, 1.5) * 0.3;
        cvDep = hill(ce * 1000, 300, 1.5) * 0.1;
        break;
      case 'Ketamine':
        analgesia = hill(ce, 0.15, 1.5) * 0.6;
        respDep = 0; // ketamine preserves respiratory drive
        cvDep = -hill(ce, 1.5, 1.8) * 0.1; // sympathomimetic
        break;
      case 'Dexmedetomidine':
        respDep = 0; // minimal respiratory depression
        cvDep = hill(ce, 0.6, 2) * 0.15;
        break;
    }
    result[name] = { sedation, analgesia, respiratoryDepression: respDep, cardiovascularDepression: cvDep };
  }
  return result;
}

// --- Derive cardiovascular extended state ---

function deriveCardiovascular(
  vitals: Vitals,
  pd: PharmacodynamicState,
  patient: Patient,
  prevCv: CardiovascularState | null
): CardiovascularState {
  const hr = vitals.hr;
  const sbp = vitals.sbp;
  const dbp = vitals.dbp;
  const map = vitals.map;

  // Estimate cardiac parameters from vitals
  const sv = map > 0 ? Math.max(20, 70 * (map / 93)) : 0;
  const co = (hr * sv) / 1000;
  const svr = co > 0 ? (map * 80) / co : 2000;

  // Drug-driven contractility
  const cvDep = Object.values(pd.drugContributions)
    .reduce((sum, d) => sum + d.cardiovascularDepression, 0);
  const contractility = Math.max(0.2, Math.min(1.2, 1.0 - cvDep));

  // Preload/afterload estimates
  const preload = Math.max(0.1, Math.min(1.0, 0.5 + (dbp / 200)));
  const afterload = Math.max(0.1, Math.min(1.0, svr / 2000));
  const ejectionFraction = Math.max(15, Math.min(75, 65 * contractility));

  // Baroreflex
  const isCHF = patient.hepaticImpairment === true && patient.drugSensitivity === 1.7;
  const baroreflexGain = isCHF ? 0.25 : Math.max(0.1, 0.5 * (1 - pd.sedationDepth * 0.4));

  const rhythm = (vitals.rhythm ?? 'normal_sinus') as CardiacRhythm;
  const lethalRhythms = ['ventricular_fibrillation', 'ventricular_tachycardia', 'polymorphic_vt', 'asystole', 'pea'];

  const frankStarling = (await import('./frankStarlingDerivation')).deriveFrankStarling({
    hr, sbp, dbp, map, co, sv, svr,
    preload, afterload, contractility, ejectionFraction,
    cvp: 8, baroreflexGain, baroreflexSetpoint: 93,
    rhythm, rhythmIsLethal: lethalRhythms.includes(rhythm),
    frankStarling: prevCv?.frankStarling ?? { curvePoints: [], operatingPoint: { preload: 0.5, sv: 70 }, curveShift: 'normal' as const, curveLabel: 'Normal' },
  });

  return {
    hr, sbp, dbp, map, co, sv, svr,
    preload, afterload, contractility, ejectionFraction,
    cvp: 8,
    baroreflexGain,
    baroreflexSetpoint: 93,
    rhythm,
    rhythmIsLethal: lethalRhythms.includes(rhythm),
    frankStarling,
  };
}

// --- Derive respiratory extended state ---

function deriveRespiratory(
  vitals: Vitals,
  pd: PharmacodynamicState,
  fio2: number
): RespiratoryState {
  const rr = vitals.rr;
  const spo2 = vitals.spo2;
  const etco2 = vitals.etco2;
  const normalRR = 14;
  const ventRatio = Math.max(rr / normalRR, 0.1);
  const tv = rr > 0 ? Math.max(50, 500 * ventRatio) : 0;
  const mv = (rr * tv) / 1000;
  const paco2 = 40 / ventRatio;
  const pao2 = fio2 * (760 - 47) - (paco2 / 0.8);

  const respDep = Object.values(pd.drugContributions)
    .reduce((sum, d) => sum + d.respiratoryDepression, 0);
  const airwayPatency = Math.max(0, 1 - pd.sedationDepth * 0.6);

  return {
    rr, tidalVolume: tv, minuteVentilation: mv,
    spo2, etco2, pao2: Math.max(0, pao2), paco2: Math.max(0, paco2),
    fio2,
    vqMismatch: Math.min(1, respDep * 0.5),
    shuntFraction: Math.min(0.3, respDep * 0.15),
    deadSpaceFraction: 0.3,
    airwayPatency,
    apneaDuration: rr === 0 ? 1 : 0,
    isApneic: rr === 0,
    respiratoryDriveDepression: respDep,
  };
}

// =================================================================
// MAIN PURE TICK FUNCTION
// =================================================================

export interface SimStateSnapshot {
  elapsedSeconds: number;
  tickCount: number;
  isRunning: boolean;
  patient: Patient;
  archetypeKey: string;
  pkStates: Record<string, PKState>;
  infusions: Record<string, InfusionState>;
  vitals: Vitals;
  moass: MOASSLevel;
  combinedEff: number;
  fio2: number;
  airwayDevice: AirwayDevice;
  o2FlowRate: number;
  interventions: Set<string>;
  trendData: TrendPoint[];
  maxTrendPoints: number;
  eventLog: LogEntry[];
  activeAlarms: { type: string; message: string; severity: 'warning' | 'danger' }[];
  eegState: EEGState | null;
  digitalTwin: DigitalTwin | null;
  ivFluids: IVFluidState;
  isScenarioActive: boolean;
  scenarioDrugProtocols: any[] | null;
  // Previous derived state for continuity
  derived?: DerivedState | null;
}

export function computeTick(state: SimStateSnapshot, dt: number = 1): TickResult {
  const newTime = state.elapsedSeconds + dt;
  const newTickCount = (state.tickCount || 0) + 1;
  const newLogs: LogEntry[] = [];

  // ============================================================
  // STEP 1: Advance PK for every drug
  // ============================================================
  const newPkStates: Record<string, PKState> = {};
  const drugSnapshots: Record<string, DrugPKSnapshot> = {};

  for (const drugName of Object.keys(state.pkStates)) {
    const drug = DRUG_DATABASE[drugName];
    if (!drug) {
      newPkStates[drugName] = state.pkStates[drugName];
      continue;
    }
    const infusion = state.infusions[drugName];
    const infusionRate = infusion?.isRunning ? infusion.rate : 0;
    const newPK = stepPK(state.pkStates[drugName], drug, 0, infusionRate, dt);
    newPkStates[drugName] = newPK;

    drugSnapshots[drugName] = {
      pk: newPK,
      plasmaConc: newPK.c1,
      effectSiteConc: newPK.ce,
      totalDoseGiven: 0, // cumulative tracked elsewhere
      isInfusing: !!infusion?.isRunning,
      infusionRate: infusionRate,
      infusionUnit: infusion?.unit || '',
      timeSinceLastBolus: 0,
    };
  }

  // ============================================================
  // STEP 2: Combined PD effect
  // ============================================================
  const drugEffects: { drug: DrugParams; ce: number }[] = Object.entries(newPkStates).map(
    ([name, pkState]) => ({ drug: DRUG_DATABASE[name], ce: pkState.ce })
  ).filter(e => e.drug != null);

  const combinedEff = combinedEffect(drugEffects);
  const moass = effectToMOASS(combinedEff);
  const contributions = computeDrugContributions(newPkStates);

  const pd: PharmacodynamicState = {
    combinedEffect: combinedEff,
    sedationDepth: combinedEff,
    moass,
    bisProxy: Math.max(0, Math.min(100, 100 - combinedEff * 60)),
    analgesiaLevel: computeAnalgesiaLevel(newPkStates),
    amnesiaLevel: computeAmnesiaLevel(newPkStates),
    muscleRelaxation: 0,
    anxiolysisLevel: computeAnxiolysisLevel(newPkStates),
    drugContributions: contributions,
  };

  // ============================================================
  // STEP 3: Full physiology from PD + patient
  // ============================================================
  const prevRhythm = (state.vitals.rhythm ?? 'normal_sinus') as CardiacRhythm;
  const newVitals = calculateVitals(
    newPkStates, state.patient, state.vitals,
    state.fio2, prevRhythm, state.elapsedSeconds
  );

  // Build extended physiology
  const respiratory = deriveRespiratory(newVitals, pd, state.fio2);
  const prevCv = state.derived?.physiology?.cardiovascular ?? null;
  const cardiovascular = deriveCardiovascular(newVitals, pd, state.patient, prevCv);

  const physiology: PhysiologyState = {
    respiratory,
    cardiovascular,
    temperature: state.derived?.physiology?.temperature ?? 36.8,
  };

  // ============================================================
  // STEP 4: Vitals display (single canonical output)
  // ============================================================
  const vitalsDisplay: VitalsDisplay = {
    hr: newVitals.hr,
    sbp: newVitals.sbp,
    dbp: newVitals.dbp,
    map: newVitals.map,
    spo2: newVitals.spo2,
    rr: newVitals.rr,
    etco2: newVitals.etco2,
    temperature: physiology.temperature,
    rhythm: (newVitals.rhythm ?? 'normal_sinus') as CardiacRhythm,
  };

  // ============================================================
  // STEP 5: ALL derived visualization — computed IN the tick
  // ============================================================
  const avatarParams = deriveAvatarParams(pd, physiology, vitalsDisplay, state.airwayDevice);
  const radarAxes = deriveRadarAxes(pd);
  const petalsGauges = derivePetalsGauges(pd, physiology, vitalsDisplay);
  const frankStarling = cardiovascular.frankStarling;
  const waveformParams = deriveWaveformParams(cardiovascular, respiratory);

  // ============================================================
  // STEP 6: EEG + Digital Twin
  // ============================================================
  const propCe = newPkStates['propofol']?.ce || 0;
  const dexCe = newPkStates['dexmedetomidine']?.ce || 0;
  const ketCe = newPkStates['ketamine']?.ce || 0;
  const midazCe = newPkStates['midazolam']?.ce || 0;
  const fentCe = newPkStates['fentanyl']?.ce || 0;
  const eegState = generateEEG(propCe, dexCe, ketCe, midazCe, fentCe,
    state.patient.age, newTime, state.eegState ?? undefined);

  const newDigitalTwin = updateTwin(
    state.digitalTwin || createDigitalTwin(state.patient),
    newPkStates, newVitals.hr, newVitals.spo2, dt,
    (newVitals.rhythm ?? 'normal_sinus') as CardiacRhythm,
    newVitals.sbp
  );

  // ============================================================
  // STEP 7: Millie context (full snapshot for AI mentor)
  // ============================================================
  const millieContext = buildMillieContext(
    state.patient, pd, vitalsDisplay, drugSnapshots,
    state.activeAlarms, state.interventions, state.airwayDevice,
    state.fio2, state.isScenarioActive, state.eventLog, state.trendData
  );

  // ============================================================
  // STEP 8: Alarms
  // ============================================================
  const rawAlarms = checkAlarms(newVitals);
  const activeAlarms: SimAlarm[] = rawAlarms.map(a => ({
    ...a, triggeredAt: newTime,
  }));

  // Log new alarms
  rawAlarms.forEach(alarm => {
    const alreadyActive = state.activeAlarms.some(
      a => a.type === alarm.type && a.severity === alarm.severity
    );
    if (!alreadyActive) {
      newLogs.push({
        time: newTime, type: 'alert',
        message: alarm.message, severity: alarm.severity,
      });
    }
  });

  // Log rhythm changes
  const newRhythm = (newVitals.rhythm ?? 'normal_sinus') as string;
  if (newRhythm !== (prevRhythm as string)) {
    const isLethal = ['ventricular_fibrillation', 'ventricular_tachycardia',
      'polymorphic_vt', 'asystole', 'pea'].includes(newRhythm);
    newLogs.push({
      time: newTime, type: 'alert',
      message: isLethal
        ? `ARRHYTHMIA: ${newRhythm.replace(/_/g, ' ').toUpperCase()}`
        : `RHYTHM CHANGE: ${(prevRhythm as string).replace(/_/g, ' ')} -> ${newRhythm.replace(/_/g, ' ')}`,
      severity: isLethal ? 'danger' : 'warning',
    });
  }

  // ============================================================
  // STEP 9: Trend data
  // ============================================================
  const newTrendPoint: TrendPoint = {
    time: newTime,
    vitals: newVitals,
    cp: Object.fromEntries(Object.entries(newPkStates).map(([n, s]) => [n, s.c1])),
    ce: Object.fromEntries(Object.entries(newPkStates).map(([n, s]) => [n, s.ce])),
    moass,
  };
  let trendData = [...state.trendData, newTrendPoint];
  if (trendData.length > state.maxTrendPoints) trendData = trendData.slice(1);

  // ============================================================
  // STEP 10: IV Fluids
  // ============================================================
  const newIvFluids: IVFluidState = { ...state.ivFluids };
  if (state.ivFluids.activeFluid && !state.ivFluids.isBolus && state.ivFluids.rate > 0) {
    newIvFluids.totalInfused = state.ivFluids.totalInfused + state.ivFluids.rate / 3600;
  }

  // ============================================================
  // ASSEMBLE: Single unified derived state
  // ============================================================
  const derived: DerivedState = {
    pd,
    physiology,
    vitalsDisplay,
    avatarParams,
    radarAxes,
    petalsGauges,
    frankStarling,
    waveformParams,
    millieContext,
  };

  return {
    elapsedSeconds: newTime,
    tickCount: newTickCount,
    pkStates: newPkStates,
    drugSnapshots,
    combinedEff,
    moass,
    vitals: newVitals,
    derived,
    eegState,
    digitalTwin: newDigitalTwin,
    activeAlarms,
    trendData,
    eventLog: [...state.eventLog, ...newLogs],
    ivFluids: newIvFluids,
  };
}
