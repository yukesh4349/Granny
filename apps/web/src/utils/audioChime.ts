// ============================================================================
// Audio Chime Synthesizer using Web Audio API
// High-quality soothing temple chimes, medicine alarms, call ringtones
// + Loud SOS Emergency Siren for immediate danger alerts
// Requires no external audio files — works in all browsers
// ============================================================================

let audioCtx: AudioContext | null = null;
let sosSirenOscillators: OscillatorNode[] = [];
let sosSirenGains: GainNode[] = [];
let sosSirenActive = false;
let sosSirenInterval: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a gentle temple bell / singing bowl chime
 * Soothing, harmonic bell frequency for calming reminders & serene moments
 */
export function playTempleBellChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const freqs = [370, 740, 1110, 1480, 2220];
    const gains = [0.4, 0.25, 0.15, 0.08, 0.04];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gains[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.3);
    });
  } catch (e) {
    console.warn('Audio chime note:', e);
  }
}

/**
 * Play a clear, melodic 3-tone ascending chime for Medication Time
 */
export function playMedicineAlertChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 440, time: 0.0, duration: 0.4 },
      { freq: 554.37, time: 0.35, duration: 0.4 },
      { freq: 659.25, time: 0.7, duration: 0.8 },
      { freq: 880, time: 1.2, duration: 1.6 },
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.001, now + n.time);
      gain.gain.linearRampToValueAtTime(0.35, now + n.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + n.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.duration + 0.1);
    });
  } catch (e) {
    console.warn('Medicine chime note:', e);
  }
}

/**
 * Play a friendly, rhythmic incoming call ringtone
 */
export function playIncomingCallRingtone() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const bursts = [0, 0.8];
    bursts.forEach(burstTime => {
      const chord = [523.25, 659.25, 783.99];
      chord.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + burstTime);

        gain.gain.setValueAtTime(0.001, now + burstTime);
        gain.gain.linearRampToValueAtTime(0.2, now + burstTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + burstTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + burstTime);
        osc.stop(now + burstTime + 0.65);
      });
    });
  } catch (e) {
    console.warn('Call ringtone note:', e);
  }
}

/**
 * Play cheerful positive feedback chime for memory game correct answer
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [
      { freq: 587.33, time: 0 },
      { freq: 739.99, time: 0.12 },
      { freq: 880.00, time: 0.24 },
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      gain.gain.setValueAtTime(0.25, now + n.time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.time + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.time);
      osc.stop(now + n.time + 0.45);
    });
  } catch (e) {
    console.warn('Success chime note:', e);
  }
}

// ─── SOS Emergency Siren ─────────────────────────────────────────────────────

/**
 * Play a LOUD, pulsing SOS emergency siren.
 * Alternates between 620 Hz and 1200 Hz at maximum gain to pierce through noise.
 * Runs continuously until stopSosSiren() is called.
 */
export function playSosSiren() {
  try {
    stopSosSiren(); // stop any existing siren first
    sosSirenActive = true;

    const ctx = getAudioContext();

    // Primary siren — loud sawtooth wail
    const sirenOsc = ctx.createOscillator();
    const sirenGain = ctx.createGain();
    sirenOsc.type = 'sawtooth';
    sirenOsc.frequency.setValueAtTime(620, ctx.currentTime);
    sirenGain.gain.setValueAtTime(0.85, ctx.currentTime);
    sirenOsc.connect(sirenGain);
    sirenGain.connect(ctx.destination);
    sirenOsc.start();
    sosSirenOscillators.push(sirenOsc);
    sosSirenGains.push(sirenGain);

    // Secondary buzzer — harsh square wave for urgency
    const buzzOsc = ctx.createOscillator();
    const buzzGain = ctx.createGain();
    buzzOsc.type = 'square';
    buzzOsc.frequency.setValueAtTime(440, ctx.currentTime);
    buzzGain.gain.setValueAtTime(0.45, ctx.currentTime);
    buzzOsc.connect(buzzGain);
    buzzGain.connect(ctx.destination);
    buzzOsc.start();
    sosSirenOscillators.push(buzzOsc);
    sosSirenGains.push(buzzGain);

    // Alternately sweep the frequency every 300ms
    let phase = 0;
    sosSirenInterval = setInterval(() => {
      if (!sosSirenActive) return;
      try {
        const t = ctx.currentTime;
        const sirenFreq = phase % 2 === 0 ? 1200 : 620;
        const buzzFreq  = phase % 2 === 0 ? 880  : 440;
        sirenOsc.frequency.setTargetAtTime(sirenFreq, t, 0.08);
        buzzOsc.frequency.setTargetAtTime(buzzFreq, t, 0.08);
        phase++;
      } catch { /* oscillator may have been stopped */ }
    }, 300);
  } catch (e) {
    console.warn('SOS siren error:', e);
  }
}

/**
 * Stop the active SOS emergency siren immediately
 */
export function stopSosSiren() {
  sosSirenActive = false;
  if (sosSirenInterval !== null) {
    clearInterval(sosSirenInterval);
    sosSirenInterval = null;
  }
  sosSirenOscillators.forEach(o => { try { o.stop(); } catch {} });
  sosSirenGains.forEach(g => { try { g.gain.setValueAtTime(0, 0); } catch {} });
  sosSirenOscillators = [];
  sosSirenGains = [];
}

/** Returns true if the SOS siren is currently playing */
export function isSosSirenPlaying(): boolean {
  return sosSirenActive;
}

