// =================================================================
// src/types/SimulationState.ts
// THE canonical state interfaces for SedSim v8
// Single source of truth - every component reads from here
// =================================================================

import type { PKState, Vitals, MOASSLevel, LogEntry, Patient, TrendPoint,
  DrugParams, InfusionState, InterventionType, AirwayDevice,
  CardiacRhythm } from '../types';
import type { EEGState } from '../engine/eegModel';
import type { DigitalTwin } from '../engine/digitalTwin';

// --- Patient Archetype & Modifiers --------------------------------

export interface ComorbidityFlags {
  osa: boolean;
  copd: boolean;
  chf: boolean;
  hepaticImpairment: 'none' | 'mild' | 'moderate' | 'severe';
  renalImpairment: 'none' | 'mild' | 'moderate' | 'severe';
  obesity: boolean;
  morbidObesity: boolean;
  elderly: boolean;
  pediatric: boolean;
  pregnant: boolean;
  cardiacValvular: 'none' | 'aortic_stenosis' | 'mitral_regurg' | 'hcm' | 'dcm';
  autonomicDysfunction: boolean;
  difficultAirway: boolean;
}

// --- PK Snapshot (per drug) ----------------------------------------

export interface DrugPKSnapshot {
  pk: PKState;
  plasmaConc: number;
  effectSiteConc: number;
  totalDoseGiven: number;
  isInfusing: boolean;
  infusionRate: number;
  infusionUnit: string;
  timeSinceLastBolus: number;
}

// --- PD Layer (combined drug effects) ------------------------------

export interface PharmacodynamicState {
  combinedEffect: number;
  sedationDepth: number;
  moass: MOASSLevel;
  bisProxy: number;
  analgesiaLevel: number;
  amnesiaLevel: number;
  muscleRelaxation: number;
  anxiolysisLevel: number;
  drugContributions: Record<string, {
    sedation: number;
    analgesia: number;
    respiratoryDepression: number;
    cardiovascularDepression: number;
  }>;
}

// --- Physiology Layer -----------------------------------------------

export interface RespiratoryState {
  rr: number;
  tidalVolume: number;
  minuteVentilation: number;
  spo2: number;
  etco2: number;
  pao2: number;
  paco2: number;
  fio2: number;
  vqMismatch: number;
  shuntFraction: number;
  deadSpaceFraction: number;
  airwayPatency: number;
  apneaDuration: number;
  isApneic: boolean;
  respiratoryDriveDepression: number;
}

export interface CardiovascularState {
  hr: number;
  sbp: number;
  dbp: number;
  map: number;
  co: number;
  sv: number;
  svr: number;
  preload: number;
  afterload: number;
  contractility: number;
  ejectionFraction: number;
  cvp: number;
  baroreflexGain: number;
  baroreflexSetpoint: number;
  rhythm: CardiacRhythm;
  rhythmIsLethal: boolean;
  frankStarling: FrankStarlingData;
}

export interface FrankStarlingData {
  curvePoints: Array<{ preload: number; sv: number }>;
  operatingPoint: { preload: number; sv: number };
  curveShift: 'normal' | 'upward' | 'downward';
  curveLabel: string;
}

export interface PhysiologyState {
  respiratory: RespiratoryState;
  cardiovascular: CardiovascularState;
  temperature: number;
}

// --- Vitals (monitor display output) --------------------------------

export interface VitalsDisplay {
  hr: number;
  sbp: number;
  dbp: number;
  map: number;
  spo2: number;
  rr: number;
  etco2: number;
  temperature: number;
  rhythm: CardiacRhythm;
}

// --- Avatar Visualization Parameters --------------------------------

export interface AvatarParams {
  skinHue: number;
  skinSaturation: number;
  skinLightness: number;
  cyanosis: number;
  diaphoresis: number;
  eyeOpenness: number;
  pupilSize: number;
  pupilReactivity: boolean;
  nystagmus: boolean;
  chestRiseAmplitude: number;
  chestRiseRate: number;
  respiratoryEffort: 'none' | 'shallow' | 'normal' | 'labored' | 'paradoxical';
  accessoryMuscleUse: boolean;
  jawPosition: 'normal' | 'slack' | 'clenched';
  consciousness: 'alert' | 'drowsy' | 'responding_to_voice' |
    'responding_to_pain' | 'unresponsive';
  isAgitated: boolean;
  emesisRisk: number;
  purposefulMovement: boolean;
  tremor: boolean;
  muscleRigidity: number;
  visibleAirwayDevice: AirwayDevice;
  ivSiteVisible: boolean;
}

// --- Radar Chart (6 normalized axes) --------------------------------

export interface RadarAxes {
  sedation: number;
  analgesia: number;
  anxiolysis: number;
  amnesia: number;
  respiratoryDepression: number;
  cardiovascularDepression: number;
}

// --- PETALS Gauges (6 parameters) -----------------------------------

export interface PetalsGauges {
  pain: number;
  sedation: number;
  respiration: number;
  hemodynamics: number;
  oxygenation: number;
  consciousness: number;
}

// --- Waveform Parameters --------------------------------------------

export interface WaveformParams {
  ecg: {
    rhythm: CardiacRhythm;
    hr: number;
    prInterval: number;
    qrsWidth: number;
    qtInterval: number;
    stDeviation: number;
    tWaveInversion: boolean;
  };
  pleth: {
    amplitude: number;
    rate: number;
    dicroticNotch: boolean;
    dampened: boolean;
  };
  capnography: {
    etco2: number;
    rr: number;
    plateau: boolean;
    shape: 'normal' | 'obstructive' | 'rebreathing' | 'absent';
  };
}

// --- Millie Context Snapshot ----------------------------------------

export interface MillieContext {
  patientSummary: string;
  currentMOASS: MOASSLevel;
  currentVitals: VitalsDisplay;
  activeDrugs: Array<{
    name: string;
    effectSiteConc: number;
    plasmaConc: number;
    isInfusing: boolean;
    totalGiven: number;
  }>;
  activeAlarms: Array<{ type: string; message: string; severity: string }>;
  activeInterventions: string[];
  airway: AirwayDevice;
  fio2: number;
  scenarioContext: {
    isActive: boolean;
    currentPhase: string;
    objectives: string[];
    timeElapsed: number;
  };
  recentEvents: LogEntry[];
  trends: {
    spo2Trend: 'stable' | 'falling' | 'rising';
    hrTrend: 'stable' | 'falling' | 'rising';
    bpTrend: 'stable' | 'falling' | 'rising';
  };
  clinicalConcerns: string[];
}

// --- Alarm ----------------------------------------------------------

export interface SimAlarm {
  type: string;
  message: string;
  severity: 'warning' | 'danger';
  triggeredAt: number;
}

// --- Drug Protocol (from store) -------------------------------------

export interface DrugProtocol {
  name: string;
  route: string;
  typicalBolusRange: [number, number];
  maxTotalDose: number;
  unit: string;
}

// --- IV Fluid State -------------------------------------------------

export interface IVFluidState {
  activeFluid: string | null;
  rate: number;
  location: string;
  gauge: string;
  totalInfused: number;
  isBolus: boolean;
  bolusVolume: number;
}

// --- True North (patient identity anchor) ---------------------------

export interface TrueNorth {
  archetypeKey: string;
  patient: Patient;
  baselineVitals: Vitals;
  label: string;
  isLocked: boolean;
}

// =================================================================
// THE UNIFIED DERIVED STATE (computed each tick)
// =================================================================

export interface DerivedState {
  pd: PharmacodynamicState;
  physiology: PhysiologyState;
  vitalsDisplay: VitalsDisplay;
  avatarParams: AvatarParams;
  radarAxes: RadarAxes;
  petalsGauges: PetalsGauges;
  frankStarling: FrankStarlingData;
  waveformParams: WaveformParams;
  millieContext: MillieContext;
}

// =================================================================
// TICK RESULT - everything that changes per tick
// =================================================================

export interface TickResult {
  elapsedSeconds: number;
  tickCount: number;
  pkStates: Record<string, PKState>;
  drugSnapshots: Record<string, DrugPKSnapshot>;
  combinedEff: number;
  moass: MOASSLevel;
  vitals: Vitals;
  derived: DerivedState;
  eegState: EEGState | null;
  digitalTwin: DigitalTwin | null;
  activeAlarms: SimAlarm[];
  trendData: TrendPoint[];
  eventLog: LogEntry[];
  ivFluids: IVFluidState;
}
