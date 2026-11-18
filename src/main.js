import { createAudio } from './audio/audio.js';
import { createApi } from './game/api.js';
import { update } from './game/sim.js';
import { hasSave, loadGame, loadSettings, saveGame } from './game/save.js';
import { createState } from './game/state.js';
import { createInput } from './input/input.js';
import { fitCanvas, render, renderLabels } from './render/render.js';
import { canvasReserve, sideTouchLayout } from './ui/layout.js';
import { createUi } from './ui/ui.js';

const canvas = document.getElementById('view');
const labels = document.getElementById('labels');
const gfx = canvas.getContext('2d', { alpha: false });
const lgfx = labels.getContext('2d');
let viewScale = 1;
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
  const dpr = Number(labels.dataset.dpr) || 1;
  lgfx.imageSmoothingEnabled = true;
  renderLabels(lgfx, state, viewScale, dpr);
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
  layout();
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
  ctx.state.panel = ctx.state.seenHelp ? null : 'help';
  ctx.state.lang = ctx.state.lang || settings.lang;
  audio.setMuted(!!ctx.state.muted);
  audio.setMusic(!ctx.state.muted);
  ui.sync();
  layout();
};

const api = createApi(ctx);
window.__farm = api;

let fitSlack = 0;

function layout() {
  const playing = !!(ctx.state?.started && ctx.state.screen === 'play');
  const touchOn = ui.touchOn() && playing;
  const sides = touchOn && sideTouchLayout(window.innerWidth, window.innerHeight);
  document.body.classList.toggle('touch-sides', sides);
  const hud = document.getElementById('hud');
  const hotbar = document.getElementById('hotbar');
  const touch = document.getElementById('touch');
  const reserve = canvasReserve({
    playing,
    hud: playing ? (hud && !hud.hidden ? hud.offsetHeight : 26) : 0,
    hotbar: playing ? (hotbar && !hotbar.hidden ? hotbar.offsetHeight : 40) : 0,
    touch: touchOn ? (touch && !touch.hidden ? touch.offsetHeight : 150) : 0,
    sideTouch: sides,
  });
  viewScale = fitCanvas(canvas, reserve + fitSlack, labels);
  const hudTop = hud && playing && !hud.hidden ? hud.getBoundingClientRect().top : canvas.getBoundingClientRect().top;
  const touchBottom = touchOn && !sides && touch && !touch.hidden ? touch.getBoundingClientRect().bottom : 0;
  const overflow = Math.max(0, -hudTop, touchBottom - window.innerHeight);
  if (overflow > 1 && fitSlack < 160) {
    fitSlack += overflow + 4;
    viewScale = fitCanvas(canvas, reserve + fitSlack, labels);
  } else if (overflow <= 0 && fitSlack > 0) {
    fitSlack = Math.max(0, fitSlack - 8);
    viewScale = fitCanvas(canvas, reserve + fitSlack, labels);
  }
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
  ui.sync();
  layout();
  ctx.draw();
  requestAnimationFrame(frame);
}

window.addEventListener('resize', layout);
window.addEventListener('beforeunload', () => { if (ctx.state?.started) saveGame(ctx.state); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden && ctx.state?.started) saveGame(ctx.state);
});
window.addEventListener('pointerdown', () => audio.unlock(), { passive: true });
window.addEventListener('keydown', () => audio.unlock());

ui.sync();
layout();
ctx.draw();
requestAnimationFrame(frame);
