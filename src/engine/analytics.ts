/**
 * src/engine/analytics.ts
 * Pure telemetry engine for A/B study research framework.
 * NO React imports — this is a plain TypeScript module.
 *
 * Captures every interaction with timestamps, stores in memory,
 * flushes to localStorage on session end, and provides CSV export
 * for SPSS/R analysis.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StudyArm = 'A' | 'B' | 'C';

export type TelemetryEventType =
  | 'session_start'
  | 'session_end'
  | 'drug_bolus'
  | 'drug_infusion_start'
  | 'drug_infusion_stop'
  | 'intervention_applied'
  | 'intervention_removed'
  | 'vital_alarm_fired'
  | 'vital_alarm_acknowledged'
  | 'mentor_question_asked'
  | 'mentor_answer_received'
  | 'learner_question_asked'
  | 'learner_answer_given'
  | 'scenario_phase_entered'
  | 'scenario_completed'
  | 'pretest_answer'
  | 'posttest_answer'
  | 'tab_opened'
  | 'gauge_mode_changed'
  | 'simmaster_event'
  | 'idle_detected'
  | 'arm_assigned'
  | 'vital_snapshot';

export interface TelemetryEvent {
  sessionId: string;
  learnerId: string;
  studyArm: StudyArm;
  scenarioId: string;
  timestamp: number;       // ms since session start
  wallClock: string;       // ISO 8601
  eventType: TelemetryEventType;
  payload: Record<string, unknown>;
}

export interface SessionSummary {
  sessionId: string;
  learnerId: string;
  studyArm: StudyArm;
  scenarioId: string;
  duration_s: number;
  totalDrugBoluses: number;
  totalInterventions: number;
  totalAlarmsTriggered: number;
  peakRiskScore: number;
  lowestSpO2: number;
  lowestMOASS: number;
  scenarioScore: number;
  pretestScore: number;
  posttestScore: number;
  mentorInteractions: number;
  meanResponseLatency_ms: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY_EVENTS = 'sedsim_study_events';
const STORAGE_KEY_SUMMARIES = 'sedsim_study_summaries';

// ---------------------------------------------------------------------------
// Analytics Engine
// ---------------------------------------------------------------------------

class AnalyticsEngine {
  private events: TelemetryEvent[] = [];
  private sessionId = '';
  private learnerId = '';
  private studyArm: StudyArm = 'A';
  private scenarioId = '';
  private sessionStartTime = 0;
  private active = false;

  /** Start a new telemetry session */
  startSession(learnerId: string, arm: StudyArm, scenarioId: string): string {
    this.sessionId = `${learnerId}-${arm}-${Date.now()}`;
    this.learnerId = learnerId;
    this.studyArm = arm;
    this.scenarioId = scenarioId;
    this.sessionStartTime = Date.now();
    this.events = [];
    this.active = true;

    this.log('session_start', { arm, scenarioId });
    return this.sessionId;
  }

  /** Log a telemetry event */
  log(eventType: TelemetryEventType, payload: Record<string, unknown> = {}): void {
    if (!this.active) return;

    const event: TelemetryEvent = {
      sessionId: this.sessionId,
      learnerId: this.learnerId,
      studyArm: this.studyArm,
      scenarioId: this.scenarioId,
      timestamp: Date.now() - this.sessionStartTime,
      wallClock: new Date().toISOString(),
      eventType,
      payload,
    };
    this.events.push(event);
  }

  /** End the session and flush to localStorage */
  endSession(): SessionSummary {
    this.log('session_end', {});
    const summary = this.computeSummary();
    this.flushToStorage();
    this.active = false;
    return summary;
  }

  /** Get all events for the current session */
  exportEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  /** Get the session summary */
  exportSummary(): SessionSummary {
    return this.computeSummary();
  }

  /** Export all events as CSV string */
  exportCSV(): string {
    const allEvents = this.getAllStoredEvents();
    if (allEvents.length === 0) return '';

    const headers = [
      'sessionId', 'learnerId', 'studyArm', 'scenarioId',
      'timestamp', 'wallClock', 'eventType', 'payload',
    ];
    const rows = allEvents.map(e => [
      e.sessionId,
      e.learnerId,
      e.studyArm,
      e.scenarioId,
      String(e.timestamp),
      e.wallClock,
      e.eventType,
      JSON.stringify(e.payload).replace(/"/g, '""'),
    ]);

    return [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(',')),
    ].join('\n');
  }

  /** Export session summaries as CSV string */
  exportSummaryCSV(): string {
    const allSummaries = this.getAllStoredSummaries();
    if (allSummaries.length === 0) return '';

    const headers: (keyof SessionSummary)[] = [
      'sessionId', 'learnerId', 'studyArm', 'scenarioId',
      'duration_s', 'totalDrugBoluses', 'totalInterventions',
      'totalAlarmsTriggered', 'peakRiskScore', 'lowestSpO2',
      'lowestMOASS', 'scenarioScore', 'pretestScore', 'posttestScore',
      'mentorInteractions', 'meanResponseLatency_ms',
    ];

    const rows = allSummaries.map(s =>
      headers.map(h => `"${String(s[h])}"`).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /** Check if a session is active */
  isActive(): boolean {
    return this.active;
  }

  /** Get the current session ID */
  getSessionId(): string {
    return this.sessionId;
  }

  /** Clear all stored data (for admin/testing) */
  clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_EVENTS);
      localStorage.removeItem(STORAGE_KEY_SUMMARIES);
    } catch {
      // localStorage may not be available
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private computeSummary(): SessionSummary {
    const boluses = this.events.filter(e => e.eventType === 'drug_bolus');
    const interventions = this.events.filter(
      e => e.eventType === 'intervention_applied'
    );
    const alarms = this.events.filter(e => e.eventType === 'vital_alarm_fired');
    const mentorEvents = this.events.filter(
      e => e.eventType === 'mentor_question_asked' || e.eventType === 'learner_question_asked'
    );
    const snapshots = this.events.filter(e => e.eventType === 'vital_snapshot');
    const pretestAnswers = this.events.filter(e => e.eventType === 'pretest_answer');
    const posttestAnswers = this.events.filter(e => e.eventType === 'posttest_answer');

    const latencies = this.events
      .filter(e => e.eventType === 'mentor_answer_received' && typeof e.payload.latency_ms === 'number')
      .map(e => e.payload.latency_ms as number);

    const lowestSpO2 = snapshots.reduce(
      (min, e) => Math.min(min, (e.payload.spo2 as number) ?? 100), 100
    );
    const lowestMOASS = snapshots.reduce(
      (min, e) => Math.min(min, (e.payload.moass as number) ?? 5), 5
    );
    const peakRisk = snapshots.reduce(
      (max, e) => Math.max(max, (e.payload.riskScore as number) ?? 0), 0
    );

    const pretestCorrect = pretestAnswers.filter(e => e.payload.correct).length;
    const posttestCorrect = posttestAnswers.filter(e => e.payload.correct).length;

    const scenarioEnd = this.events.find(e => e.eventType === 'scenario_completed');
    const durationMs = this.events.length > 0
      ? this.events[this.events.length - 1].timestamp
      : 0;

    return {
      sessionId: this.sessionId,
      learnerId: this.learnerId,
      studyArm: this.studyArm,
      scenarioId: this.scenarioId,
      duration_s: Math.round(durationMs / 1000),
      totalDrugBoluses: boluses.length,
      totalInterventions: interventions.length,
      totalAlarmsTriggered: alarms.length,
      peakRiskScore: peakRisk,
      lowestSpO2: lowestSpO2,
      lowestMOASS: lowestMOASS,
      scenarioScore: (scenarioEnd?.payload.score as number) ?? 0,
      pretestScore: pretestAnswers.length > 0
        ? Math.round((pretestCorrect / pretestAnswers.length) * 100)
        : 0,
      posttestScore: posttestAnswers.length > 0
        ? Math.round((posttestCorrect / posttestAnswers.length) * 100)
        : 0,
      mentorInteractions: mentorEvents.length,
      meanResponseLatency_ms: latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0,
    };
  }

  private flushToStorage(): void {
    try {
      // Append events
      const storedEvents = this.getAllStoredEvents();
      storedEvents.push(...this.events);
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(storedEvents));

      // Append summary
      const storedSummaries = this.getAllStoredSummaries();
      storedSummaries.push(this.computeSummary());
      localStorage.setItem(STORAGE_KEY_SUMMARIES, JSON.stringify(storedSummaries));
    } catch {
      // localStorage may not be available or full
    }
  }

  private getAllStoredEvents(): TelemetryEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
      return raw ? (JSON.parse(raw) as TelemetryEvent[]) : [];
    } catch {
      return [];
    }
  }

  private getAllStoredSummaries(): SessionSummary[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SUMMARIES);
      return raw ? (JSON.parse(raw) as SessionSummary[]) : [];
    } catch {
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const analyticsEngine = new AnalyticsEngine();
