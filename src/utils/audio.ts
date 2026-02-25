/**
 * AudioManager — Web Audio API sound system for SedSim.
 *
 * Features:
 *  • SpO2 pitch-mapped pulse tone (one beep per heartbeat, pitch drops with saturation)
 *  • Warning alarm: two-tone beep (440 Hz → 880 Hz), every 3 seconds
 *  • Critical alarm: fast 880 Hz beep, every 200 ms (100 ms on / 100 ms off)
 *  • Master mute / volume
 *  • 60-second alarm silence (like real monitors)
 */

/** Map SpO2 percentage to oscillator frequency (Hz). */
function spo2ToFrequency(spo2: number): number {
  if (spo2 >= 100) return 880;
  if (spo2 >= 90) return 660 + ((spo2 - 90) / 10) * 220; // 660–880 Hz
  if (spo2 >= 80) return 440 + ((spo2 - 80) / 10) * 220; // 440–660 Hz
  if (spo2 >= 70) return 330 + ((spo2 - 70) / 10) * 110; // 330–440 Hz
  return 250; // below 70 % stays low
}

/**
 * Play a single sine-wave beep with a 5 ms attack/release envelope
 * to prevent audible clicks.
 */
function scheduleBeep(
  ctx: AudioContext,
  masterGain: GainNode,
  frequency: number,
  durationSec: number,
  startTime: number,
): void {
  const osc = ctx.createOscillator();
  const envGain = ctx.createGain();
  const RAMP = 0.005; // 5 ms ramp

  osc.type = 'sine';
  osc.frequency.value = frequency;

  envGain.gain.setValueAtTime(0, startTime);
  envGain.gain.linearRampToValueAtTime(1, startTime + RAMP);
  envGain.gain.setValueAtTime(1, startTime + durationSec - RAMP);
  envGain.gain.linearRampToValueAtTime(0, startTime + durationSec);

  osc.connect(envGain);
  envGain.connect(masterGain);

  osc.start(startTime);
  osc.stop(startTime + durationSec);
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  // SpO2 pulse-tone state
  private spo2Timer: ReturnType<typeof setTimeout> | null = null;
  private spo2Active: boolean = false;
  private _spo2: number = 98;
  private _hr: number = 75;

  // Alarm state
  private alarmTimer: ReturnType<typeof setTimeout> | null = null;
  private alarmType: 'none' | 'warning' | 'critical' = 'none';
  private silencedUntil: number = 0;

  /**
   * Lazy-initialise the AudioContext on the first user gesture.
   * Must be called from a click/keydown handler (browser autoplay policy).
   */
  init(): void {
    if (this.ctx) {
      // Resume if the context was suspended by the browser
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {/* ignore */});
      }
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('[AudioManager] AudioContext init failed', e);
    }
  }

  /**
   * Update the SpO2 / HR values used for the pulse tone and start the loop
   * if it is not already running.  Call this on every vitals update while
   * the simulation is running.
   */
  updateSpO2Tone(spo2: number, hr: number): void {
    this._spo2 = spo2;
    this._hr = Math.max(10, hr); // guard against 0-division
    if (!this.spo2Active) {
      this.spo2Active = true;
      this._tickSpO2();
    }
  }

  private _tickSpO2(): void {
    if (!this.spo2Active || !this.ctx || !this.masterGain) return;

    if (!this.isMuted && this.ctx.state === 'running') {
      scheduleBeep(
        this.ctx,
        this.masterGain,
        spo2ToFrequency(this._spo2),
        0.065, // 65 ms beep
        this.ctx.currentTime,
      );
    }

    const intervalMs = 60000 / this._hr; // one beep per heartbeat
    this.spo2Timer = setTimeout(() => this._tickSpO2(), intervalMs);
  }

  /** Start the warning alarm loop (two-tone, every 3 s). No-op if already active. */
  playWarningAlarm(): void {
    if (this.alarmType === 'warning') return;
    this._clearAlarmTimer();
    this.alarmType = 'warning';
    this._tickWarning();
  }

  private _tickWarning(): void {
    if (this.alarmType !== 'warning' || !this.ctx || !this.masterGain) return;

    if (!this.isMuted && Date.now() > this.silencedUntil && this.ctx.state === 'running') {
      const now = this.ctx.currentTime;
      scheduleBeep(this.ctx, this.masterGain, 440, 0.2, now);
      scheduleBeep(this.ctx, this.masterGain, 880, 0.2, now + 0.25);
    }

    this.alarmTimer = setTimeout(() => this._tickWarning(), 3000);
  }

  /** Start the critical alarm loop (fast 880 Hz beeps). No-op if already active. */
  playCriticalAlarm(): void {
    if (this.alarmType === 'critical') return;
    this._clearAlarmTimer();
    this.alarmType = 'critical';
    this._tickCritical();
  }

  private _tickCritical(): void {
    if (this.alarmType !== 'critical' || !this.ctx || !this.masterGain) return;

    if (!this.isMuted && Date.now() > this.silencedUntil && this.ctx.state === 'running') {
      scheduleBeep(this.ctx, this.masterGain, 880, 0.1, this.ctx.currentTime);
    }

    this.alarmTimer = setTimeout(() => this._tickCritical(), 200); // 100 ms on + 100 ms off
  }

  /** Stop all alarm loops. */
  stopAlarms(): void {
    this.alarmType = 'none';
    this._clearAlarmTimer();
  }

  /**
   * Silence alarm audio for the given duration (SpO2 pulse tone continues).
   * Mirrors the 60-second silence feature on real monitors.
   */
  silenceAlarms(durationMs: number): void {
    this.silencedUntil = Date.now() + durationMs;
  }

  /** Milliseconds remaining on current alarm silence (0 if not silenced). */
  getSilenceRemaining(): number {
    return Math.max(0, this.silencedUntil - Date.now());
  }

  /** Stop the SpO2 pulse tone and all alarms (call on Pause / Reset). */
  stopAll(): void {
    this.spo2Active = false;
    if (this.spo2Timer !== null) {
      clearTimeout(this.spo2Timer);
      this.spo2Timer = null;
    }
    this.stopAlarms();
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        muted ? 0 : this.volume,
        this.ctx.currentTime,
      );
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  dispose(): void {
    this.stopAll();
    if (this.ctx) {
      this.ctx.close().catch(() => {/* ignore */});
      this.ctx = null;
      this.masterGain = null;
    }
  }

  private _clearAlarmTimer(): void {
    if (this.alarmTimer !== null) {
      clearTimeout(this.alarmTimer);
      this.alarmTimer = null;
    }
  }
}

export const audioManager = new AudioManager();
