/**
 * Material 3 Expressive Sound & Haptics Engine
 * Synthesizes soft, organic acoustic feedback using the Web Audio API.
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.initAudioContext();
  }

  initAudioContext() {
    // Lazy initialize to adhere to browser autoplay policies
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch {
      this.audioCtx = null;
    }
  }

  ensureContext() {
    if (!this.audioCtx) {
      this.initAudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound(enabled) {
    if (typeof enabled === 'boolean') {
      this.soundEnabled = enabled;
    } else {
      this.soundEnabled = !this.soundEnabled;
    }
    return this.soundEnabled;
  }

  // Trigger browser haptic vibration if supported (mobile devices)
  vibrate(ms = 10) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch {
        // Ignored if device does not permit
      }
    }
  }

  /**
   * Play a procedural tactile click with subtle pitch and decay
   */
  playKey(type = 'number') {
    this.vibrate(type === 'equals' ? 25 : 8);

    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    try {
      const t = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'number') {
        // Soft wooden bubble click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.start(t);
        osc.stop(t + 0.045);
      } else if (type === 'operator') {
        // Crisp snappy pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, t);
        osc.frequency.exponentialRampToValueAtTime(260, t + 0.05);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.055);
      } else if (type === 'function') {
        // Soft rounded blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(380, t + 0.04);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        osc.start(t);
        osc.stop(t + 0.045);
      } else if (type === 'backspace' || type === 'clear') {
        // Downward pop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.start(t);
        osc.stop(t + 0.065);
      } else if (type === 'equals') {
        // Expressive dual-tone chord
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);

        osc.type = 'sine';
        osc2.type = 'sine';

        // Major triad chime (E5 and G#5 / B5)
        osc.frequency.setValueAtTime(659.25, t);
        osc2.frequency.setValueAtTime(987.77, t + 0.02);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        gain2.gain.setValueAtTime(0.08, t + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        osc.start(t);
        osc.stop(t + 0.15);
        osc2.start(t + 0.02);
        osc2.stop(t + 0.17);
      }
    } catch {
      // Audio playback fails silently if browser blocks or is not ready
    }
  }
}

// Export instance
window.soundEngine = new SoundEngine();
