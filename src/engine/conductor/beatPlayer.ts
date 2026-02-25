/**
 * src/engine/conductor/beatPlayer.ts
 * Conductor Core — Beat Queue Management
 *
 * Receives an ordered array of Beat objects and plays them in sequence,
 * honouring the delayMs field on each beat. For each beat it dispatches the
 * appropriate side-effect to useAIStore / useSimStore via the provided
 * dispatcher callbacks.
 */

import type { Beat } from './types';
import type { EventBus } from './eventBus';

export interface BeatDispatcher {
  /** Show a Millie chat bubble. */
  onMillie: (text: string, beatId: string) => void;
  /** Activate callout highlights on the UI. */
  onCallout: (callout: NonNullable<Beat['callout']>, beatId: string) => void;
  /** Display a vital badge annotation. */
  onVitalBadge: (badge: NonNullable<Beat['vitalBadge']>, beatId: string) => void;
  /** Dispatch a simulation action (e.g. administer_drug). */
  onSimAction: (action: NonNullable<Beat['simAction']>, beatId: string) => void;
  /** Present an interactive question to the learner. */
  onQuestion: (
    question: NonNullable<Beat['question']>,
    stepId: string,
    beatId: string
  ) => void;
  /** Announce a phase label. */
  onPhase: (label: string, beatId: string) => void;
}

export class BeatPlayer {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private isPlaying = false;

  constructor(
    private readonly dispatcher: BeatDispatcher,
    private readonly bus: EventBus
  ) {}

  /**
   * Start playing a list of beats for the given step.
   * Any previously scheduled timers are cancelled first.
   */
  play(beats: Beat[], stepId: string): void {
    this.stop();
    this.isPlaying = true;

    for (const beat of beats) {
      const timer = setTimeout(() => {
        if (!this.isPlaying) return;
        this.dispatchBeat(beat, stepId);
      }, beat.delayMs);
      this.timers.push(timer);
    }
  }

  /**
   * Cancel all pending beat timers.
   */
  stop(): void {
    this.isPlaying = false;
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
  }

  /** Whether the player has active (pending) timers. */
  get playing(): boolean {
    return this.isPlaying;
  }

  private dispatchBeat(beat: Beat, stepId: string): void {
    // Emit raw beat event so the Conductor (and tests) can observe every beat.
    this.bus.emit({ type: 'beat', beat, stepId });

    switch (beat.type) {
      case 'millie':
        if (beat.millieText) {
          this.dispatcher.onMillie(beat.millieText, beat.id);
        }
        break;

      case 'callout':
        if (beat.callout) {
          this.dispatcher.onCallout(beat.callout, beat.id);
        }
        break;

      case 'vitalBadge':
        if (beat.vitalBadge) {
          this.dispatcher.onVitalBadge(beat.vitalBadge, beat.id);
        }
        break;

      case 'simAction':
        if (beat.simAction) {
          this.dispatcher.onSimAction(beat.simAction, beat.id);
        }
        break;

      case 'question':
        if (beat.question) {
          this.dispatcher.onQuestion(beat.question, stepId, beat.id);
        }
        break;

      case 'phase':
        if (beat.phaseLabel) {
          this.dispatcher.onPhase(beat.phaseLabel, beat.id);
        }
        break;

      case 'pause':
        // Deliberate no-op — timing gap only.
        break;

      default:
        break;
    }
  }
}
