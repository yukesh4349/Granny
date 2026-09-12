// Universal Audio Service: Sound effects, melody playback & Text-to-Speech
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

class AudioService {
  private audioCtx: any = null;

  private getAudioContext() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        return this.audioCtx;
      }
    }
    return null;
  }

  // Play a positive success chime
  playSuccessSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.24); // G5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.log('Audio chime error (harmless):', e);
    }
  }

  // Play gentle tap feedback
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

  // Play a melodic snippet for "Complete the Tune"
  playMelodicTune(tuneIndex: number = 0) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Gentle pentatonic melodies
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

  // Text-To-Speech (universal across Web & Native)
  speak(text: string, onDone?: () => void) {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any pending
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Slightly slower, clearer for elders
        utterance.pitch = 1.0;
        utterance.onend = () => onDone && onDone();
        utterance.onerror = () => onDone && onDone();
        window.speechSynthesis.speak(utterance);
      } else {
        Speech.stop();
        Speech.speak(text, {
          rate: 0.88,
          pitch: 1.0,
          onDone: onDone,
          onError: onDone,
        });
      }
    } catch (e) {
      console.log('TTS speak error:', e);
      if (onDone) onDone();
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
