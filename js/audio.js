// Procedural audio for Echoes from the Void.
// Everything is synthesized with the Web Audio API — no asset files, no downloads.
// The ambient drone reacts to sanity; events fire short synthesized stingers.
Game.Audio = {
  ctx: null,
  master: null,
  droneGain: null,
  dissGain: null,
  osc1: null,
  osc2: null,
  diss: null,
  noiseBuffer: null,
  started: false,
  enabled: true,
  _lastClick: 0,

  // Read persisted mute preference. Audio can only truly start from a user
  // gesture (the DESCEND/CONTINUE button), so init() is called from there.
  loadPref() {
    try {
      this.enabled = localStorage.getItem('echoes_void_muted') !== '1';
    } catch (e) { this.enabled = true; }
  },

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    } catch (e) { return; }

    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 1 : 0;
    this.master.connect(this.ctx.destination);

    // One reusable buffer of white noise for clicks and bursts.
    const len = this.ctx.sampleRate * 1.0;
    this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },

  // Continuous low hum built from two near-detuned oscillators plus a
  // dissonant partial that fades in as sanity falls.
  startDrone() {
    if (!this.ctx || this.started) return;
    this.started = true;
    const now = this.ctx.currentTime;

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.connect(this.master);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.0001;
    this.droneGain.gain.exponentialRampToValueAtTime(0.07, now + 4);
    this.droneGain.connect(lp);

    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sine';
    this.osc1.frequency.value = 55;
    this.osc1.connect(this.droneGain);
    this.osc1.start();

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'sine';
    this.osc2.frequency.value = 55.4;
    this.osc2.connect(this.droneGain);
    this.osc2.start();

    // Slow breathing LFO on the drone level.
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.09;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(this.droneGain.gain);
    lfo.start();

    // Dissonant tritone partial — silent at full sanity.
    this.dissGain = this.ctx.createGain();
    this.dissGain.gain.value = 0.0001;
    this.dissGain.connect(lp);
    this.diss = this.ctx.createOscillator();
    this.diss.type = 'sine';
    this.diss.frequency.value = 55 * 1.414;
    this.diss.connect(this.dissGain);
    this.diss.start();
  },

  stopDrone() {
    if (!this.ctx || !this.started) return;
    const now = this.ctx.currentTime;
    [this.droneGain, this.dissGain].forEach(g => {
      if (g) g.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    });
    this.started = false;
  },

  // Map sanity -> beating rate + dissonance. Lower sanity = more sour, alive.
  setSanity(sanity) {
    if (!this.ctx || !this.started) return;
    const t = this.ctx.currentTime;
    const drift = (100 - sanity) * 0.0009; // up to ~+9% detune at 0 sanity
    this.osc2.frequency.setTargetAtTime(55 * (1 + drift), t, 2);
    const diss = sanity < 55 ? ((55 - sanity) / 55) * 0.05 : 0.0001;
    this.dissGain.gain.setTargetAtTime(Math.max(0.0001, diss), t, 2);
  },

  // Faint key-press tick used by the typewriter. Throttled so concurrent
  // reveals don't pile up.
  click() {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    if (now - this._lastClick < 0.012) return;
    this._lastClick = now;

    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400 + Math.random() * 700;
    bp.Q.value = 6;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.025, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    src.connect(bp); bp.connect(g); g.connect(this.master);
    src.start(now);
    src.stop(now + 0.05);
  },

  _tone(type, f0, f1, dur, peak, dest) {
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, now);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), now + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(now);
    o.stop(now + dur + 0.05);
    return g;
  },

  _noiseBurst(dur, peak, cutoff) {
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(peak, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(lp); lp.connect(g); g.connect(this.master);
    src.start(now);
    src.stop(now + dur + 0.05);
  },

  // One-shot event sounds keyed off game events.
  stinger(type) {
    if (!this.enabled || !this.ctx) return;
    switch (type) {
      case 'hazard': {
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        lp.connect(this.master);
        this._tone('sawtooth', 190, 55, 0.6, 0.16, lp);
        this._noiseBurst(0.25, 0.12, 1200);
        break;
      }
      case 'sanity': // dissonant cluster on a hard mental hit
        this._tone('sine', 300, 296, 0.5, 0.07);
        this._tone('sine', 317, 313, 0.5, 0.07);
        break;
      case 'item': // clean bell for a gain / lucid moment
        this._tone('triangle', 880, 880, 0.8, 0.10);
        this._tone('triangle', 1320, 1320, 0.7, 0.05);
        break;
      case 'descend': // soft low footstep cadence on each descent
        this._tone('sine', 72, 46, 0.28, 0.10);
        break;
      case 'escape': // rising, brighter — release
        this._tone('sine', 220, 660, 1.1, 0.12);
        this._tone('triangle', 440, 880, 1.0, 0.05);
        break;
      case 'death': // slow collapse into sub-bass
        this._tone('sine', 90, 22, 2.2, 0.16);
        this._tone('sine', 90 * 1.414, 30, 1.8, 0.06);
        break;
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem('echoes_void_muted', this.enabled ? '0' : '1'); } catch (e) {}
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.enabled ? 1 : 0, this.ctx.currentTime, 0.1);
    }
    return this.enabled;
  }
};
