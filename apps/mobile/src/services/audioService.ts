// Universal Audio Service for Granny Mobile: Sound synthesis, chimes, SOS Siren & Text-to-Speech
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

class AudioService {
  private audioCtx: any = null;
  private sosSirenOscillators: any[] = [];
  private sosSirenGains: any[] = [];
  private sosSirenActive = false;
  private sosSirenInterval: any = null;

  private getAudioContext() {
    if (typeof window !== 'undefined') {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        return this.audioCtx;
      }
    }
    return null;
  }

  // 1. Soothing Temple Bell Chime (for calm reminders & serenity)
  playTempleBellChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
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
      console.log('Temple bell chime note:', e);
    }
  }

  // 2. Ascending 4-tone Medication Alert Chime
  playMedicineAlertChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
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
      console.log('Medicine chime note:', e);
    }
  }

  // 3. Incoming Family Call Ringtone
  playIncomingCallRingtone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
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
      console.log('Call ringtone note:', e);
    }
  }

  // 4. Positive Success Sound (Game Answer Correct)
  playSuccessSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
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
      console.log('Audio chime error:', e);
    }
  }

  // 5. Tactile Button Tap Feedback
  playTapSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {}
  }

  // 6. Loud SOS Emergency Siren (Continuous Alternating Wail)
  playSosSiren() {
    try {
      this.stopSosSiren();
      this.sosSirenActive = true;
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const sirenOsc = ctx.createOscillator();
      const sirenGain = ctx.createGain();
      sirenOsc.type = 'sawtooth';
      sirenOsc.frequency.setValueAtTime(620, ctx.currentTime);
      sirenGain.gain.setValueAtTime(0.85, ctx.currentTime);
      sirenOsc.connect(sirenGain);
      sirenGain.connect(ctx.destination);
      sirenOsc.start();
      this.sosSirenOscillators.push(sirenOsc);
      this.sosSirenGains.push(sirenGain);

      const buzzOsc = ctx.createOscillator();
      const buzzGain = ctx.createGain();
      buzzOsc.type = 'square';
      buzzOsc.frequency.setValueAtTime(440, ctx.currentTime);
      buzzGain.gain.setValueAtTime(0.45, ctx.currentTime);
      buzzOsc.connect(buzzGain);
      buzzGain.connect(ctx.destination);
      buzzOsc.start();
      this.sosSirenOscillators.push(buzzOsc);
      this.sosSirenGains.push(buzzGain);

      let phase = 0;
      this.sosSirenInterval = setInterval(() => {
        if (!this.sosSirenActive) return;
        try {
          const t = ctx.currentTime;
          const sirenFreq = phase % 2 === 0 ? 1200 : 620;
          const buzzFreq = phase % 2 === 0 ? 880 : 440;
          sirenOsc.frequency.setTargetAtTime(sirenFreq, t, 0.08);
          buzzOsc.frequency.setTargetAtTime(buzzFreq, t, 0.08);
          phase++;
        } catch {}
      }, 300);
    } catch (e) {
      console.warn('SOS siren error:', e);
    }
  }

  stopSosSiren() {
    this.sosSirenActive = false;
    if (this.sosSirenInterval !== null) {
      clearInterval(this.sosSirenInterval);
      this.sosSirenInterval = null;
    }
    this.sosSirenOscillators.forEach(o => { try { o.stop(); } catch {} });
    this.sosSirenGains.forEach(g => { try { g.gain.setValueAtTime(0, 0); } catch {} });
    this.sosSirenOscillators = [];
    this.sosSirenGains = [];
  }

  isSosSirenPlaying(): boolean {
    return this.sosSirenActive;
  }

  // 7. Melodic Tune Snippet for Games
  playMelodicTune(tuneIndex: number = 0) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const tunes = [
        [261.63, 293.66, 329.63, 392.00, 523.25], // C Major Pentatonic
        [440.00, 493.88, 523.25, 659.25, 587.33], // A Minor Acoustic
        [349.23, 392.00, 440.00, 523.25, 587.33], // F Warm Breeze
        [392.00, 440.00, 493.88, 587.33, 659.25], // G Sunset
      ];

      const notes = tunes[tuneIndex % tunes.length];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + i * 0.4;
        const noteEnd = noteStart + 0.38;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);
        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteEnd);
      });
    } catch (e) {
      console.log('Melody playback note:', e);
    }
  }

  // 8. Text-To-Speech (Multilingual Tamil & English Support)
  speak(text: string, onDoneOrLang?: string | (() => void), onDone?: () => void) {
    let language = 'ta';
    let callback: (() => void) | undefined = onDone;

    if (typeof onDoneOrLang === 'function') {
      callback = onDoneOrLang;
    } else if (typeof onDoneOrLang === 'string') {
      language = onDoneOrLang;
    }

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.88; // Comfortably slow for seniors
        utterance.pitch = 1.0;
        utterance.lang = language === 'ta' ? 'ta-IN' : 'en-US';
        utterance.onend = () => callback && callback();
        utterance.onerror = () => callback && callback();
        window.speechSynthesis.speak(utterance);
      } else {
        Speech.stop();
        Speech.speak(text, {
          language: language === 'ta' ? 'ta-IN' : 'en-US',
          rate: 0.88,
          pitch: 1.0,
          onDone: callback,
          onError: callback,
        });
      }
    } catch (e) {
      console.log('TTS speak error:', e);
      if (callback) callback();
    }
  }

  stopSpeaking() {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      } else {
        Speech.stop();
      }
    } catch (e) {}
  }
}

export const audioService = new AudioService();
