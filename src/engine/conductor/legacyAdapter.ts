/**
 * src/engine/conductor/legacyAdapter.ts
 * Conductor Core — Legacy Scenario Adapter
 *
 * Converts an InteractiveScenarioStep (the existing format used by
 * ScenarioEngine.ts) into the new ConductorStep / Beat format, so that
 * existing scenarios work with the Conductor without requiring manual rewrites.
 *
 * Beat generation strategy:
 *   1. Each line in millieDialogue[] → a 'millie' beat, staggered 2.5 s apart.
 *   2. Each highlight[] entry → a 'callout' beat at the same delay as the
 *      corresponding dialogue line (or 0 ms if no dialogue).
 *   3. simActions[] → 'simAction' beats, fired after all dialogue.
 *   4. question → 'question' beat, fired after simActions (or after dialogue).
 */

import type { InteractiveScenarioStep } from '../ScenarioEngine';
import type { Beat, ConductorStep } from './types';

/** Milliseconds between consecutive Millie dialogue lines. */
const MILLIE_LINE_GAP_MS = 2_500;

/** Milliseconds added after all dialogue before simActions fire. */
const PRE_ACTION_DELAY_MS = 500;

/**
 * Convert a single InteractiveScenarioStep into a ConductorStep.
 */
export function convertLegacyStep(
  step: InteractiveScenarioStep
): ConductorStep {
  const beats: Beat[] = [];
  let seq = 0;

  const nextId = (suffix: string) => `${step.id}_beat_${seq++}_${suffix}`;

  // ── 1. Millie dialogue ────────────────────────────────────────────────────
  let dialogueEndMs = 0;
  step.millieDialogue.forEach((line, index) => {
    const delayMs = index * MILLIE_LINE_GAP_MS;
    beats.push({
      id: nextId('millie'),
      type: 'millie',
      delayMs,
      millieText: line,
    });
    dialogueEndMs = delayMs;
  });

  // ── 2. Highlight callouts (paired with dialogue lines where possible) ─────
  (step.highlight ?? []).forEach((targetId, index) => {
    const delayMs = index < step.millieDialogue.length
      ? index * MILLIE_LINE_GAP_MS
      : dialogueEndMs;
    beats.push({
      id: nextId('callout'),
      type: 'callout',
      delayMs,
      callout: {
        targetId,
        text: step.millieDialogue[index] ?? '',
      },
    });
  });

  // ── 3. Simulation actions ─────────────────────────────────────────────────
  const actionsStartMs = dialogueEndMs + PRE_ACTION_DELAY_MS;
  (step.simActions ?? []).forEach((action, index) => {
    beats.push({
      id: nextId('simAction'),
      type: 'simAction',
      delayMs: actionsStartMs + index * 250,
      simAction: action,
    });
  });

  // ── 4. Question ───────────────────────────────────────────────────────────
  if (step.question) {
    const questionDelay =
      actionsStartMs +
      (step.simActions?.length ?? 0) * 250 +
      500;
    beats.push({
      id: nextId('question'),
      type: 'question',
      delayMs: questionDelay,
      question: step.question,
      questionStepId: step.id,
    });
  }

  return {
    id: step.id,
    phase: step.phase,
    triggerType: step.triggerType,
    triggerCondition: step.triggerCondition,
    triggerTimeSeconds: step.triggerTimeSeconds,
    afterStepId: step.afterStepId,
    beats,
    teachingPoints: step.teachingPoints,
  };
}

/**
 * Convert all steps in an existing InteractiveScenario into ConductorSteps.
 * Returns a flat array ready for insertion into a ConductorScenario.
 */
export function convertLegacySteps(
  steps: InteractiveScenarioStep[]
): ConductorStep[] {
  return steps.map(convertLegacyStep);
}
