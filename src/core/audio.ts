// Procedural audio engine — every sound is synthesised at runtime via the Web
// Audio API. No sample files: zero download weight and zero licensing risk.
// SFX are short oscillator/noise bursts; the music bed is a scheduled arpeggio
// whose tempo + volume track match momentum.

import { getSave } from './save';

type SfxName = 'ui' | 'kick' | 'pass' | 'shoot' | 'goal' | 'whistle' | 'save' | 'surge' | 'win';

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxOn = true;
  private musicOn = true;
  private noiseBuf: AudioBuffer | null = null;

  // music state
  private musicTimer: number | null = null;
  private step = 0;
  private intensity = 0; // 0..1
  private musicPlaying = false;

  // Chord progression (root midi notes) the arpeggio walks through.
  private readonly progression = [57, 60, 53, 55]; // Am - C - F - G feel

  init(): void {
    if (this.ctx) return;
    try {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;
      this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.0;
      this.musicGain.connect(this.master);
      this.noiseBuf = this.makeNoise(0.6);
    } catch {
      this.ctx = null;
    }
    this.syncSettings();
  }

  // Pull on/off from the save settings (called at init and when settings change).
  syncSettings(): void {
    try {
      const s = getSave().settings;
      this.sfxOn = s.sfx;
      this.musicOn = s.music;
      if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(this.musicOn ? 0.18 : 0, this.ctx.currentTime, 0.2);
      }
    } catch {
      /* save not ready */
    }
  }

  // Must be called from a user gesture (click/key) to satisfy autoplay policy.
  resume(): void {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  private makeNoise(seconds: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(dur: number, gain: number, filterType: BiquadFilterType, freq: number): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuf) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.sfxGain);
    src.start(t);
    src.stop(t + dur);
  }

  play(name: SfxName): void {
    if (!this.sfxOn) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    switch (name) {
      case 'ui':
        this.tone(440, 0.06, 'triangle', 0.18);
        this.tone(660, 0.05, 'triangle', 0.12);
        break;
      case 'kick':
        this.tone(180, 0.09, 'sine', 0.4, 90);
        this.noise(0.04, 0.1, 'bandpass', 1200);
        break;
      case 'pass':
        this.tone(320, 0.07, 'sine', 0.22, 240);
        break;
      case 'shoot':
        this.tone(240, 0.16, 'sawtooth', 0.3, 90);
        this.noise(0.12, 0.18, 'highpass', 800);
        break;
      case 'save':
        this.tone(140, 0.12, 'square', 0.25, 80);
        break;
      case 'goal':
        [0, 4, 7, 12].forEach((semi, i) => {
          window.setTimeout(() => this.tone(440 * Math.pow(2, semi / 12), 0.18, 'square', 0.26), i * 70);
        });
        this.noise(0.7, 0.16, 'bandpass', 2200); // crowd swell
        break;
      case 'surge':
        this.tone(300, 0.4, 'sawtooth', 0.22, 900);
        break;
      case 'whistle':
        this.tone(2100, 0.14, 'square', 0.16);
        window.setTimeout(() => this.tone(2300, 0.12, 'square', 0.14), 90);
        break;
      case 'win':
        [0, 4, 7, 12, 16, 19].forEach((semi, i) => {
          window.setTimeout(() => this.tone(392 * Math.pow(2, semi / 12), 0.22, 'triangle', 0.24), i * 110);
        });
        break;
    }
  }

  private midiToFreq(m: number): number {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  // --- adaptive music bed ---------------------------------------------------

  startMusic(intensity = 0.3): void {
    this.init();
    if (!this.ctx || this.musicPlaying) return;
    this.intensity = intensity;
    this.musicPlaying = true;
    this.step = 0;
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(this.musicOn ? 0.18 : 0, this.ctx.currentTime, 0.3);
    const tick = () => {
      this.scheduleStep();
      const beatMs = 300 - this.intensity * 110; // faster when tense
      this.musicTimer = window.setTimeout(tick, beatMs);
    };
    tick();
  }

  private scheduleStep(): void {
    if (!this.ctx || !this.musicGain || !this.musicOn) return;
    const chordRoot = this.progression[Math.floor(this.step / 4) % this.progression.length];
    const arp = [0, 7, 12, 7][this.step % 4];
    const note = this.midiToFreq(chordRoot + arp + 12);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = note;
    const vol = 0.05 + this.intensity * 0.05;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.25);
    // bass on the downbeat
    if (this.step % 4 === 0) {
      const bass = this.ctx.createOscillator();
      const bg = this.ctx.createGain();
      bass.type = 'sine';
      bass.frequency.value = this.midiToFreq(chordRoot - 12);
      bg.gain.setValueAtTime(0.0001, t);
      bg.gain.exponentialRampToValueAtTime(0.08 + this.intensity * 0.04, t + 0.03);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      bass.connect(bg);
      bg.connect(this.musicGain);
      bass.start(t);
      bass.stop(t + 0.45);
    }
    this.step++;
  }

  setIntensity(x: number): void {
    this.intensity = Math.max(0, Math.min(1, x));
  }

  stopMusic(): void {
    this.musicPlaying = false;
    if (this.musicTimer != null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx && this.musicGain) this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
  }
}

export const audio = new AudioManager();
