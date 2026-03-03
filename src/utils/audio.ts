/**
 * AudioManager — Web Audio API sound system for SedSim.
 *
 * Features:
 *  • SpO2 pitch-mapped pulse tone (one beep per heartbeat, pitch drops with saturation)
 *  • Warning alarm: two-tone beep (440 Hz → 880 Hz), every 3 seconds
 *  • Critical alarm: fast 880 Hz beep, every 200 ms (100 ms on / 100 ms off)
 *  • Breath sounds: RR-paced white noise (bandpass 300-600 Hz); snoring when
 *    airway compromised; stridor for laryngospasm; silence on apnea
 *  • Heart sounds: S1/S2 click pair at HR interval
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

  // Breath sound state
  private breathEnabled: boolean = false;
  private breathTimer: ReturnType<typeof setTimeout> | null = null;
  private breathActive: boolean = false;
  private _rr: number = 14;
  private _moass: number = 3;
  private _airwayPatency: number = 1.0; // 0 = occluded, 1 = patent

  // Heart sound state
  private heartEnabled: boolean = false;
  private heartTimer: ReturnType<typeof setTimeout> | null = null;
  private heartActive: boolean = false;
  private _hrForHeart: number = 75;
  private _sbp: number = 120;

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
    // Stop breath and heart sounds
    this.breathActive = false;
    if (this.breathTimer !== null) { clearTimeout(this.breathTimer); this.breathTimer = null; }
    this.heartActive = false;
    if (this.heartTimer !== null) { clearTimeout(this.heartTimer); this.heartTimer = null; }
  }

  // ─── Breath sounds ──────────────────────────────────────────────────────────

  /**
   * Update breath-sound parameters. Starts the loop if breath sounds are enabled
   * and not already running.
   * @param rr  Respiratory rate (breaths/min)
   * @param moass  MOASS level (0–5); ≤3 may trigger snoring
   * @param airwayPatency  0 = occluded (laryngospasm), 1 = patent
   */
  updateBreathSounds(rr: number, moass: number, airwayPatency: number): void {
    this._rr = Math.max(0, rr);
    this._moass = moass;
    this._airwayPatency = Math.max(0, Math.min(1, airwayPatency));
    if (this.breathEnabled && !this.breathActive) {
      this.breathActive = true;
      this._tickBreath();
    }
  }

  setBreathSoundsEnabled(enabled: boolean): void {
    this.breathEnabled = enabled;
    if (!enabled) {
      this.breathActive = false;
      if (this.breathTimer !== null) { clearTimeout(this.breathTimer); this.breathTimer = null; }
    } else if (!this.breathActive) {
      this.breathActive = true;
      this._tickBreath();
    }
  }

  private _tickBreath(): void {
    if (!this.breathActive || !this.breathEnabled || !this.ctx || !this.masterGain) return;

    const rr = this._rr;
    // Apnea — no sound
    if (rr <= 0) {
      const nextMs = 2000;
      this.breathTimer = setTimeout(() => this._tickBreath(), nextMs);
      return;
    }

    const breathPeriodMs = 60000 / rr;

    if (!this.isMuted && this.ctx.state === 'running') {
      const now = this.ctx.currentTime;
      const breathDur = Math.min(1.8, (breathPeriodMs / 1000) * 0.45); // ~45% of cycle is inspiration

      if (this._airwayPatency < 0.3) {
        // Laryngospasm / severe obstruction — stridor (800-1200 Hz narrowband)
        this._scheduleStridor(now, breathDur * 0.6);
      } else if (this._moass <= 3 && this._airwayPatency < 0.8) {
        // Partial obstruction — snoring (80-120 Hz sawtooth)
        this._scheduleSnoring(now, breathDur);
      } else {
        // Normal breath — filtered white noise burst
        this._scheduleBreathBurst(now, breathDur);
      }
    }

    this.breathTimer = setTimeout(() => this._tickBreath(), breathPeriodMs);
  }

  private _scheduleBreathBurst(startTime: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 450; // centre ~450 Hz
    bandpass.Q.value = 1.5;

    const envGain = this.ctx.createGain();
    const RAMP = 0.03;
    envGain.gain.setValueAtTime(0, startTime);
    envGain.gain.linearRampToValueAtTime(0.06, startTime + RAMP);
    envGain.gain.setValueAtTime(0.06, startTime + duration - RAMP);
    envGain.gain.linearRampToValueAtTime(0, startTime + duration);

    source.connect(bandpass);
    bandpass.connect(envGain);
    envGain.connect(this.masterGain);
    source.start(startTime);
    source.stop(startTime + duration);
  }

  private _scheduleSnoring(startTime: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 100; // 80–120 Hz range; use 100 Hz

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 400;

    const envGain = this.ctx.createGain();
    const RAMP = 0.05;
    envGain.gain.setValueAtTime(0, startTime);
    envGain.gain.linearRampToValueAtTime(0.08, startTime + RAMP);
    envGain.gain.setValueAtTime(0.08, startTime + duration - RAMP);
    envGain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(lpf);
    lpf.connect(envGain);
    envGain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private _scheduleStridor(startTime: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1000; // 800–1200 Hz
    bandpass.Q.value = 4.0; // narrow

    const envGain = this.ctx.createGain();
    const RAMP = 0.02;
    envGain.gain.setValueAtTime(0, startTime);
    envGain.gain.linearRampToValueAtTime(0.12, startTime + RAMP);
    envGain.gain.setValueAtTime(0.12, startTime + duration - RAMP);
    envGain.gain.linearRampToValueAtTime(0, startTime + duration);

    source.connect(bandpass);
    bandpass.connect(envGain);
    envGain.connect(this.masterGain);
    source.start(startTime);
    source.stop(startTime + duration);
  }

  // ─── Heart sounds ────────────────────────────────────────────────────────────

  /**
   * Update heart-sound parameters. Starts the loop if heart sounds are enabled.
   * @param hr  Heart rate (bpm)
   * @param sbp  Systolic blood pressure (mmHg); lower → more muffled
   */
  updateHeartSounds(hr: number, sbp: number): void {
    this._hrForHeart = Math.max(10, hr);
    this._sbp = sbp;
    if (this.heartEnabled && !this.heartActive) {
      this.heartActive = true;
      this._tickHeart();
    }
  }

  setHeartSoundsEnabled(enabled: boolean): void {
    this.heartEnabled = enabled;
    if (!enabled) {
      this.heartActive = false;
      if (this.heartTimer !== null) { clearTimeout(this.heartTimer); this.heartTimer = null; }
    } else if (!this.heartActive) {
      this.heartActive = true;
      this._tickHeart();
    }
  }

  private _tickHeart(): void {
    if (!this.heartActive || !this.heartEnabled || !this.ctx || !this.masterGain) return;

    const intervalMs = 60000 / this._hrForHeart;

    if (!this.isMuted && this.ctx.state === 'running') {
      const now = this.ctx.currentTime;
      // Volume scales with SBP — muffled below 80 mmHg
      const vol = Math.min(1, Math.max(0.2, (this._sbp - 40) / 80));
      this._scheduleS1S2(now, vol);
    }

    this.heartTimer = setTimeout(() => this._tickHeart(), intervalMs);
  }

  private _scheduleS1S2(startTime: number, volumeScale: number): void {
    if (!this.ctx || !this.masterGain) return;
    // S1 — low-frequency thump ~60 Hz, 40 ms
    this._scheduleHeartClick(startTime,        60, 0.04, volumeScale * 0.15);
    // S2 — slightly higher ~80 Hz, 25 ms, 120 ms after S1
    this._scheduleHeartClick(startTime + 0.12, 80, 0.025, volumeScale * 0.10);
  }

  private _scheduleHeartClick(startTime: number, freq: number, dur: number, gain: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const lpf = this.ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 200;

    const envGain = this.ctx.createGain();
    const RAMP = 0.004;
    envGain.gain.setValueAtTime(0, startTime);
    envGain.gain.linearRampToValueAtTime(gain, startTime + RAMP);
    envGain.gain.setValueAtTime(gain, startTime + dur - RAMP);
    envGain.gain.linearRampToValueAtTime(0, startTime + dur);

    osc.connect(lpf);
    lpf.connect(envGain);
    envGain.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + dur);
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
