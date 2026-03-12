/**
 * src/ai/simMasterBridge.ts
 * SimMaster v4 — Bridge Module
 *
 * Bridges proactive mentor triggers and clinical pattern detection
 * to the visual annotation overlay system. This module provides a
 * clean integration point between the mentor/trigger subsystem and
 * the SimMasterOverlay UI component.
 *
 * The bridge evaluates the current simulation state, runs pattern
 * matching, generates v4 annotations, and dispatches them to the
 * store for the overlay to render.
 */

import type { TeachingMode, SimMasterV4Annotation } from '../store/slices/aiSlice';
import type { SimMasterContext, ProactiveTriggerType } from './simMaster';
import {
  evaluateV4Patterns,
  triggerToAnnotations,
  checkIdleAttention,
  postDrugAnnotation,
} from './simMaster';
import { matchPatterns } from './simMasterKnowledge';

// ---------------------------------------------------------------------------
// Bridge: evaluate all v4 sources and collect annotations
// ---------------------------------------------------------------------------

export interface BridgeResult {
  annotations: SimMasterV4Annotation[];
  matchedPatternIds: string[];
}

/**
 * Run a full evaluation cycle: clinical patterns + idle check.
 * Returns all annotations that should be dispatched to the overlay.
 */
export function evaluateAll(
  ctx: SimMasterContext,
  teachingMode: TeachingMode,
): BridgeResult {
  const annotations: SimMasterV4Annotation[] = [];

  // 1. Clinical pattern detection
  const patternAnnotations = evaluateV4Patterns(ctx, teachingMode);
  annotations.push(...patternAnnotations);

  // 2. Idle attention check
  const idleAnn = checkIdleAttention(ctx, teachingMode);
  if (idleAnn) annotations.push(idleAnn);

  // Collect matched pattern IDs for telemetry
  const params: Record<string, number> = {
    hr: ctx.vitals.hr,
    spo2: ctx.vitals.spo2,
    sbp: ctx.vitals.sbp,
    rr: ctx.vitals.rr,
    etco2: ctx.vitals.etco2,
    moass: ctx.moass,
    combinedEff: ctx.combinedEff,
  };
  if (ctx.eegState) {
    params['bis'] = ctx.eegState.bisIndex;
  }
  const matches = matchPatterns(params);
  const matchedPatternIds = matches.map(m => m.pattern.id);

  return { annotations, matchedPatternIds };
}

/**
 * Bridge a proactive mentor trigger to v4 annotations.
 */
export function bridgeTrigger(
  triggerType: ProactiveTriggerType,
  mentorMessage: string,
  teachingMode: TeachingMode,
): SimMasterV4Annotation[] {
  return triggerToAnnotations(triggerType, mentorMessage, teachingMode);
}

/**
 * Bridge a drug administration event to a teaching annotation.
 */
export function bridgeDrugEvent(
  drugName: string,
  dose: number,
  teachingMode: TeachingMode,
): SimMasterV4Annotation | null {
  return postDrugAnnotation(drugName, dose, teachingMode);
}
