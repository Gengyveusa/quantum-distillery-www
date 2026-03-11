/**
 * src/store/useStudyStore.ts
 * Zustand store for the A/B study research framework.
 * Manages learner identity, arm assignment, rotation progress,
 * test scores, and research mode toggle.
 */

import { create } from 'zustand';
import type { StudyArm } from '../engine/analytics';

// ---------------------------------------------------------------------------
// Latin-square counterbalancing sequences
// ---------------------------------------------------------------------------

/** 6 possible orderings of 3 arms (full Latin square). */
const LATIN_SQUARE: StudyArm[][] = [
  ['A', 'B', 'C'],
  ['A', 'C', 'B'],
  ['B', 'A', 'C'],
  ['B', 'C', 'A'],
  ['C', 'A', 'B'],
  ['C', 'B', 'A'],
];

const STORAGE_KEY = 'sedsim_study_state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StudyPhase =
  | 'not_enrolled'
  | 'enrollment'
  | 'consent'
  | 'pretest'
  | 'simulation'
  | 'posttest'
  | 'between_arms'
  | 'review'
  | 'completed';

export interface ArmResult {
  arm: StudyArm;
  pretestScore: number;
  posttestScore: number;
  completed: boolean;
}

export interface StudyState {
  // Research mode toggle
  researchMode: boolean;
  setResearchMode: (on: boolean) => void;
  toggleResearchMode: () => void;

  // Learner identity
  learnerId: string;
  setLearnerId: (id: string) => void;
  generateLearnerId: () => string;

  // Consent
  consentGiven: boolean;
  giveConsent: () => void;

  // Arm assignment (aliases: armSequence = rotationSequence, currentRotation = currentRotationIndex)
  armSequence: StudyArm[];
  rotationSequence: StudyArm[];
  currentRotation: number;
  currentRotationIndex: number;
  currentArm: StudyArm;
  assignArms: () => void;

  // Rotation progress
  armResults: ArmResult[];
  recordPretestScore: (score: number) => void;
  completePretestScore: (score: number) => void;
  recordPosttestScore: (score: number) => void;
  completePosttestScore: (score: number) => void;
  completeCurrentArm: () => void;
  advanceToNextRotation: () => void;
  advanceToNextArm: () => void;

  // Study completion
  isStudyComplete: boolean;

  // Phase within current rotation (phase and currentPhase are aliases)
  phase: StudyPhase;
  currentPhase: StudyPhase;
  setPhase: (phase: StudyPhase) => void;
  startPosttest: () => void;

  // Persistence
  saveToStorage: () => void;
  loadFromStorage: () => boolean;
  resetStudy: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const useStudyStore = create<StudyState>()((set, get) => {
  // Shared action implementations
  const recordPretestScoreFn = (score: number) => {
    const { currentRotation, armResults } = get();
    const updated = [...armResults];
    if (updated[currentRotation]) {
      updated[currentRotation] = { ...updated[currentRotation], pretestScore: score };
    }
    set({ armResults: updated });
  };

  const recordPosttestScoreFn = (score: number) => {
    const { currentRotation, armResults } = get();
    const updated = [...armResults];
    if (updated[currentRotation]) {
      updated[currentRotation] = { ...updated[currentRotation], posttestScore: score };
    }
    set({ armResults: updated });
  };

  const advanceToNextRotationFn = () => {
    const { currentRotation, armSequence } = get();
    const next = currentRotation + 1;
    if (next < armSequence.length) {
      set({
        currentRotation: next,
        currentRotationIndex: next,
        currentArm: armSequence[next],
        phase: 'between_arms',
        currentPhase: 'between_arms',
      });
    } else {
      set({
        isStudyComplete: true,
        phase: 'completed',
        currentPhase: 'completed',
      });
    }
    get().saveToStorage();
  };

  return {
    researchMode: false,
    setResearchMode: (on) => set({ researchMode: on }),
    toggleResearchMode: () => set(s => ({ researchMode: !s.researchMode })),

    learnerId: '',
    setLearnerId: (id) => set({ learnerId: id }),
    generateLearnerId: () => {
      const id = `L-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      set({ learnerId: id });
      return id;
    },

    consentGiven: false,
    giveConsent: () => set({ consentGiven: true, phase: 'consent', currentPhase: 'consent' }),

    armSequence: ['A', 'B', 'C'],
    rotationSequence: ['A', 'B', 'C'],
    currentRotation: 0,
    currentRotationIndex: 0,
    currentArm: 'A',
    assignArms: () => {
      const id = get().learnerId;
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
      }
      const idx = Math.abs(hash) % LATIN_SQUARE.length;
      const sequence = LATIN_SQUARE[idx];
      set({
        armSequence: sequence,
        rotationSequence: sequence,
        currentRotation: 0,
        currentRotationIndex: 0,
        currentArm: sequence[0],
        armResults: sequence.map(arm => ({
          arm,
          pretestScore: 0,
          posttestScore: 0,
          completed: false,
        })),
      });
    },

    armResults: [],
    recordPretestScore: recordPretestScoreFn,
    completePretestScore: recordPretestScoreFn,
    recordPosttestScore: recordPosttestScoreFn,
    completePosttestScore: recordPosttestScoreFn,
    completeCurrentArm: () => {
      const { currentRotation, armResults } = get();
      const updated = [...armResults];
      if (updated[currentRotation]) {
        updated[currentRotation] = { ...updated[currentRotation], completed: true };
      }
      set({ armResults: updated });
    },
    advanceToNextRotation: advanceToNextRotationFn,
    advanceToNextArm: advanceToNextRotationFn,

    isStudyComplete: false,

    phase: 'not_enrolled',
    currentPhase: 'not_enrolled',
    setPhase: (phase) => {
      set({ phase, currentPhase: phase });
      get().saveToStorage();
    },

    startPosttest: () => {
      set({ phase: 'posttest', currentPhase: 'posttest' });
      get().saveToStorage();
    },

    saveToStorage: () => {
      try {
        const s = get();
        const data = {
          learnerId: s.learnerId,
          consentGiven: s.consentGiven,
          armSequence: s.armSequence,
          currentRotation: s.currentRotation,
          currentArm: s.currentArm,
          armResults: s.armResults,
          isStudyComplete: s.isStudyComplete,
          phase: s.phase,
          researchMode: s.researchMode,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        // localStorage may not be available
      }
    },

    loadFromStorage: () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        const phase = data.phase ?? data.currentPhase ?? 'not_enrolled';
        const rotation = data.currentRotation ?? 0;
        const sequence = data.armSequence ?? ['A', 'B', 'C'];
        set({
          learnerId: data.learnerId ?? '',
          consentGiven: data.consentGiven ?? false,
          armSequence: sequence,
          rotationSequence: sequence,
          currentRotation: rotation,
          currentRotationIndex: rotation,
          currentArm: data.currentArm ?? 'A',
          armResults: data.armResults ?? [],
          isStudyComplete: data.isStudyComplete ?? false,
          phase,
          currentPhase: phase,
          researchMode: data.researchMode ?? false,
        });
        return true;
      } catch {
        return false;
      }
    },

    resetStudy: () => {
      set({
        learnerId: '',
        consentGiven: false,
        armSequence: ['A', 'B', 'C'],
        rotationSequence: ['A', 'B', 'C'],
        currentRotation: 0,
        currentRotationIndex: 0,
        currentArm: 'A',
        armResults: [],
        isStudyComplete: false,
        phase: 'enrollment',
        currentPhase: 'enrollment',
      });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // noop
      }
    },
  };
});

export default useStudyStore;
