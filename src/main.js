import { createAudio } from './audio/audio.js';
import { createApi } from './game/api.js';
import { update } from './game/sim.js';
import { hasSave, loadGame, loadSettings, saveGame } from './game/save.js';
import { createState } from './game/state.js';
import { createInput } from './input/input.js';
import { fitCanvas, render } from './render/render.js';
import { createUi } from './ui/ui.js';

const canvas = document.getElementById('view');
const gfx = canvas.getContext('2d', { alpha: false });
const settings = loadSettings();
const audio = createAudio();
audio.setMuted(settings.muted);

const ctx = {
  state: null,
  settings,
  audio,
  refresh() { ui.sync(); },
  hasContinue() { return hasSave() || !!(ctx.state && ctx.state.started); },
  onNew() {},
  onContinue() {},
  update,
  draw() {},
};

let preview = null;

function bootState() {
  const saved = loadGame();
  if (saved) {
    saved.screen = 'title';
    saved.paused = true;
    saved.panel = null;
    saved.lang = settings.lang;
    saved.muted = settings.muted;
    saved.touch = settings.touch;
    return saved;
  }
  return { started: false, screen: 'title', lang: settings.lang, muted: settings.muted, touch: settings.touch, panel: null };
}

ctx.state = bootState();

function drawWorld(state) {
  gfx.imageSmoothingEnabled = false;
  render(gfx, state);
}

ctx.draw = () => {
  const showing = ctx.state?.started ? ctx.state : previewState();
  drawWorld(showing);
};

function previewState() {
  if (!preview) {
    preview = createState(settings.lang, true);
    preview.screen = 'title';
    preview.muted = true;
  }
  return preview;
}

const input = createInput(canvas, () => ctx.state);
const ui = createUi(ctx);

ctx.onNew = () => {
  audio.unlock();
  audio.setMusic(!settings.muted);
  const lang = ctx.state?.lang || settings.lang;
  const muted = !!(ctx.state?.muted ?? settings.muted);
  const touch = ctx.state?.touch || settings.touch || 'auto';
  ctx.state = createState(lang, muted);
  ctx.state.touch = touch;
  ctx.state.panel = 'help';
  ctx.state.seenHelp = false;
  ctx.state.screen = 'play';
  saveGame(ctx.state);
  ui.sync();
};

ctx.onContinue = () => {
  audio.unlock();
  if (!ctx.state?.started) {
    const loaded = loadGame();
    if (!loaded) return;
    ctx.state = loaded;
  }
  ctx.state.screen = 'play';
  ctx.state.paused = false;
  ctx.state.panel = null;
  ctx.state.lang = ctx.state.lang || settings.lang;
  audio.setMuted(!!ctx.state.muted);
  audio.setMusic(!ctx.state.muted);
  ui.sync();
};

const api = createApi(ctx);
window.__farm = api;

function layout() {
  const reserve = ui.touchOn() ? 176 : 10;
  fitCanvas(canvas, reserve);
}

let last = performance.now();
let saveAcc = 0;

function frame(now) {
  const dt = Math.min(80, now - last);
  last = now;
  const state = ctx.state;
  if (state?.started && state.screen === 'play') {
    update(state, input.frame(), dt);
    audio.pump(state, dt);
    saveAcc += dt;
    if (saveAcc > 20000) {
      saveAcc = 0;
      saveGame(state);
    }
  }
  input.endFrame();
  layout();
  ctx.draw();
  ui.sync();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', layout);
window.addEventListener('beforeunload', () => { if (ctx.state?.started) saveGame(ctx.state); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ctx.state?.started) saveGame(ctx.state);
});
window.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
window.addEventListener('keydown', () => audio.unlock());

layout();
ui.sync();
ctx.draw();
requestAnimationFrame(frame);
