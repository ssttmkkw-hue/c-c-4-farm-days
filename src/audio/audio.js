const SCALE = [262, 294, 330, 392, 440, 349, 330, 294];

export function createAudio() {
  let ac = null;
  let muted = false;
  let lastN = -1;
  let timer = 0;
  let step = 0;
  let musicOn = false;

  function unlock() {
    try {
      if (!ac) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        ac = new Ctx();
      }
      if (ac.state === 'suspended') ac.resume();
    } catch {
      ac = null;
    }
  }

  function tone(freq, dur, type, gain, slide) {
    if (muted || !ac) return;
    try {
      const t0 = ac.currentTime;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
      o.connect(g);
      g.connect(ac.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch {
      /* ignore audio glitches */
    }
  }

  function play(name) {
    if (name === 'hoe') tone(160, 0.09, 'square', 0.03, 70);
    else if (name === 'water') {
      tone(720, 0.08, 'sine', 0.025, 360);
      tone(540, 0.1, 'triangle', 0.02, 280);
    } else if (name === 'plant') tone(520, 0.08, 'triangle', 0.03, 680);
    else if (name === 'harvest') tone(640, 0.12, 'square', 0.03, 420);
    else if (name === 'pickup') tone(880, 0.07, 'sine', 0.03, 1200);
    else if (name === 'coin') {
      tone(880, 0.08, 'square', 0.025, 660);
      tone(1320, 0.1, 'square', 0.02);
    } else if (name === 'chicken') tone(980, 0.09, 'square', 0.02, 1400);
    else if (name === 'cow') tone(180, 0.18, 'sawtooth', 0.02, 120);
    else if (name === 'talk') tone(500, 0.05, 'sine', 0.02);
    else if (name === 'ui') tone(420, 0.04, 'square', 0.02);
    else if (name === 'ship') tone(300, 0.1, 'triangle', 0.03, 180);
    else if (name === 'sleep') tone(360, 0.25, 'sine', 0.02, 220);
    else if (name === 'gift') tone(760, 0.1, 'triangle', 0.03, 980);
    else if (name === 'place') tone(240, 0.08, 'square', 0.03, 140);
  }

  function tickMusic(dt) {
    if (muted || !musicOn || !ac) return;
    timer += dt;
    if (timer < 520) return;
    timer = 0;
    const f = SCALE[step % SCALE.length];
    tone(f, 0.36, 'triangle', 0.012);
    if (step % 4 === 0) tone(f / 2, 0.42, 'sine', 0.01);
    step += 1;
  }

  return {
    unlock,
    setMuted(flag) {
      muted = !!flag;
    },
    setMusic(on) {
      musicOn = !!on;
    },
    play,
    pump(state, dt) {
      if (!state) return;
      if (state.sfxN !== lastN) {
        lastN = state.sfxN;
        if (state.sfxName) play(state.sfxName);
      }
      tickMusic(dt || 16);
    },
  };
}
