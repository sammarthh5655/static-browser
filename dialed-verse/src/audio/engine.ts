/**
 * All sound in Dialed-verse is synthesized live with the Web Audio API.
 * Graph: [sfx bus] + [music bus] + [game bus] -> master -> compressor -> destination
 * The context is only created/resumed on the first user gesture (never autoplays).
 */

type Wave = OscillatorType;

class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  /** Game stimulus bus: NOT affected by the SFX slider so sensory games stay calibrated. */
  game!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private pad: { stop: () => void } | null = null;
  private padHue = -1;
  private lastHover = 0;

  settings = { enabled: true, master: 0.8, sfx: 0.7, music: 0.25, musicOn: true };

  /** Call from any user gesture. Safe to call repeatedly. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.game = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.music.connect(this.master);
      this.game.connect(this.ctx.destination); // stimulus bypasses compressor for accurate loudness
      this.master.connect(comp).connect(this.ctx.destination);
      this.applySettings();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get ready() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  configure(s: Partial<AudioEngine['settings']>) {
    this.settings = { ...this.settings, ...s };
    this.applySettings();
  }

  private applySettings() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const on = this.settings.enabled ? 1 : 0;
    this.master.gain.setTargetAtTime(this.settings.master * on, t, 0.03);
    this.sfx.gain.setTargetAtTime(this.settings.sfx, t, 0.03);
    this.music.gain.setTargetAtTime(this.settings.musicOn ? this.settings.music : 0, t, 0.3);
    this.game.gain.setTargetAtTime(on * 0.9, t, 0.03);
  }

  private noise(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.noiseBuf) {
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuf;
  }

  /** Low-level enveloped oscillator. */
  blip(freq: number, dur = 0.12, opts: { type?: Wave; vol?: number; delay?: number; slideTo?: number; bus?: 'sfx' | 'game' | 'music'; attack?: number } = {}) {
    if (!this.ctx) return;
    const { type = 'sine', vol = 0.25, delay = 0, slideTo, bus = 'sfx', attack = 0.005 } = opts;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus === 'game' ? this.game : bus === 'music' ? this.music : this.sfx);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noiseHit(dur: number, freq: number, vol = 0.2, delay = 0, q = 1, type: BiquadFilterType = 'bandpass', bus: 'sfx' | 'game' = 'sfx') {
    if (!this.ctx) return;
    const buf = this.noise();
    if (!buf) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus === 'game' ? this.game : this.sfx);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  // ---------- UI sounds ----------
  click() { this.blip(1400, 0.05, { type: 'triangle', vol: 0.12 }); this.blip(700, 0.04, { type: 'sine', vol: 0.08 }); }
  hover() {
    const now = performance.now();
    if (now - this.lastHover < 60) return;
    this.lastHover = now;
    this.blip(2400 + Math.random() * 300, 0.025, { type: 'sine', vol: 0.03 });
  }
  toggle(on: boolean) { this.blip(on ? 900 : 600, 0.06, { type: 'square', vol: 0.05, slideTo: on ? 1300 : 400 }); }
  whoosh() { this.noiseHit(0.35, 900, 0.18, 0, 0.7); this.noiseHit(0.25, 2400, 0.08, 0.05, 0.5); }
  tick(high = false) { this.blip(high ? 1760 : 1100, 0.07, { type: 'square', vol: 0.07 }); }
  slide(v: number) {
    // v 0..1 -> gentle detent tick
    const now = performance.now();
    if (now - this.lastHover < 35) return;
    this.lastHover = now;
    this.blip(500 + v * 900, 0.02, { type: 'triangle', vol: 0.035 });
  }
  pop() { this.blip(500, 0.09, { type: 'sine', vol: 0.18, slideTo: 1200 }); }
  /** Positive feedback. quality 0..1 makes it brighter/higher. */
  success(quality = 1) {
    const base = 523.25 * Math.pow(2, Math.round(quality * 4) / 12);
    [0, 4, 7, 12].forEach((s, i) => this.blip(base * Math.pow(2, s / 12), 0.35, { type: 'triangle', vol: 0.12, delay: i * 0.06 }));
  }
  fail() {
    this.blip(180, 0.28, { type: 'sawtooth', vol: 0.09, slideTo: 90 });
    this.blip(190, 0.28, { type: 'square', vol: 0.05, slideTo: 95 });
  }
  /** Rising pitch with streak/combo count. */
  combo(n: number) {
    const f = 440 * Math.pow(2, Math.min(n, 24) / 12);
    this.blip(f, 0.12, { type: 'square', vol: 0.06 });
    this.blip(f * 1.5, 0.16, { type: 'sine', vol: 0.08, delay: 0.03 });
  }
  countdown(final = false) {
    if (final) { this.blip(880, 0.35, { type: 'square', vol: 0.1 }); this.blip(1760, 0.35, { type: 'sine', vol: 0.08 }); }
    else this.blip(440, 0.12, { type: 'square', vol: 0.08 });
  }
  fanfare(intensity = 1) {
    const notes = [0, 4, 7, 12, 16, 19, 24];
    const n = 3 + Math.round(intensity * 4);
    notes.slice(0, n).forEach((s, i) => {
      this.blip(392 * Math.pow(2, s / 12), 0.5, { type: 'sawtooth', vol: 0.05, delay: i * 0.07 });
      this.blip(392 * Math.pow(2, s / 12), 0.6, { type: 'triangle', vol: 0.09, delay: i * 0.07 });
    });
    this.noiseHit(0.8, 6000, 0.05, n * 0.07, 0.3, 'highpass');
  }
  /** Rolling ticks for slot-machine reveals. */
  roll(i: number) { this.blip(300 + (i % 12) * 60, 0.03, { type: 'square', vol: 0.04 }); }
  drum(kind: 'kick' | 'snare' | 'hat' | 'click' = 'click', delay = 0) {
    if (!this.ctx) return;
    if (kind === 'kick') this.blip(150, 0.25, { type: 'sine', vol: 0.5, slideTo: 45, delay, bus: 'game' });
    else if (kind === 'snare') this.noiseHit(0.18, 1800, 0.35, delay, 0.8, 'bandpass', 'game');
    else if (kind === 'hat') this.noiseHit(0.05, 8000, 0.2, delay, 0.5, 'highpass', 'game');
    else { this.blip(1500, 0.05, { type: 'square', vol: 0.18, delay, bus: 'game' }); this.blip(3000, 0.03, { type: 'sine', vol: 0.12, delay, bus: 'game' }); }
  }

  /** Sustained stimulus tone on the game bus. Returns stop(). */
  tone(freq: number, dur: number, opts: { type?: Wave; vol?: number; delay?: number } = {}) {
    if (!this.ctx) return () => {};
    const { type = 'sine', vol = 0.3, delay = 0 } = opts;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.setValueAtTime(vol, t + Math.max(0.03, dur - 0.05));
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g).connect(this.game);
    o.start(t);
    o.stop(t + dur + 0.05);
    return () => {
      try {
        const n = this.ctx!.currentTime;
        g.gain.cancelScheduledValues(n);
        g.gain.setTargetAtTime(0, n, 0.01);
        o.stop(n + 0.08);
      } catch { /* already stopped */ }
    };
  }

  /** Continuous adjustable tone (for "dial it in" previews). */
  live(freq: number, vol = 0.3, type: Wave = 'sine') {
    if (!this.ctx) return { set: (_f: number, _v?: number) => {}, stop: () => {} };
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0;
    g.gain.setTargetAtTime(vol, ctx.currentTime, 0.015);
    o.connect(g).connect(this.game);
    o.start();
    let stopped = false;
    return {
      set: (f: number, v?: number) => {
        if (stopped) return;
        o.frequency.setTargetAtTime(f, ctx.currentTime, 0.01);
        if (v !== undefined) g.gain.setTargetAtTime(v, ctx.currentTime, 0.01);
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        g.gain.setTargetAtTime(0, ctx.currentTime, 0.015);
        o.stop(ctx.currentTime + 0.1);
      },
    };
  }

  /** Soft piano-ish note on the game bus. */
  note(freq: number, dur = 0.9, delay = 0, vol = 0.18) {
    this.blip(freq, dur, { type: 'triangle', vol, delay, bus: 'game', attack: 0.01 });
    this.blip(freq * 2, dur * 0.6, { type: 'sine', vol: vol * 0.3, delay, bus: 'game', attack: 0.01 });
  }

  // ---------- Ambient music pad ----------
  /** Start/morph an evolving pad whose key is derived from a hue. */
  startPad(hue: number) {
    if (!this.ctx || !this.settings.musicOn) return;
    if (this.pad && this.padHue === hue) return;
    this.stopPad();
    this.padHue = hue;
    const ctx = this.ctx;
    const root = 110 * Math.pow(2, (Math.round(hue / 30) % 12) / 12);
    const chord = [0, 7, 12, 15, 19, 26];
    const out = ctx.createGain();
    out.gain.value = 0;
    out.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 4);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.Q.value = 3;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05 + (hue % 7) / 100;
    lfoGain.gain.value = 450;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    const oscs: OscillatorNode[] = [];
    chord.forEach((s, i) => {
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = i < 2 ? 'sawtooth' : 'triangle';
        o.frequency.value = root * Math.pow(2, s / 12);
        o.detune.value = det + i;
        const g = ctx.createGain();
        g.gain.value = 0.05 / (1 + i * 0.4);
        o.connect(g).connect(filter);
        o.start();
        oscs.push(o);
      }
    });
    filter.connect(out).connect(this.music);
    this.pad = {
      stop: () => {
        const t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setTargetAtTime(0, t, 0.6);
        setTimeout(() => {
          oscs.forEach((o) => { try { o.stop(); } catch { /* noop */ } });
          try { lfo.stop(); } catch { /* noop */ }
          out.disconnect();
        }, 3000);
      },
    };
  }

  stopPad() {
    this.pad?.stop();
    this.pad = null;
    this.padHue = -1;
  }

  /** Duck music (e.g. during audio-based games). */
  duck(on: boolean) {
    if (!this.ctx) return;
    const v = on ? 0 : this.settings.musicOn ? this.settings.music : 0;
    this.music.gain.setTargetAtTime(v, this.ctx.currentTime, 0.25);
  }
}

export const audio = new AudioEngine();
export type { AudioEngine };

/** Note helpers */
export const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export function freqToNoteName(f: number) {
  const m = 69 + 12 * Math.log2(f / 440);
  const r = Math.round(m);
  const cents = Math.round((m - r) * 100);
  return { name: NOTE_NAMES[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1), cents };
}
