import {
  advanceDialogue,
  chestMove,
  closePanel,
  doPassout,
  give,
  go,
  held,
  interact,
  sleep,
  togglePanel,
  useTool,
} from './actions.js';
import { DAY_END } from './calendar.js';
import { showToast } from './state.js';
import { findLink, getMap } from '../world/maps.js';
import { bodyBlocked } from '../world/tiles.js';
import { PEN } from './pens.js';

const MENU_LOCK = new Set(['sleep', 'passout', 'help', 'dialogue']);

function emptyInput() {
  return { x: 0, y: 0, pressed: {}, holdUse: false, wheel: 0 };
}

export function update(state, input, dtMs) {
  if (!state || !state.started || state.screen !== 'play') return;
  const inp = input || emptyInput();
  const total = Math.max(0, Math.min(Number(dtMs) || 0, 2000)) / 1000;
  handleInput(state, inp, total);
  if (state.panel || state.paused || state.screen !== 'play') {
    if (state.toastT > 0) state.toastT = Math.max(0, state.toastT - total);
    return;
  }
  let ms = total * 1000;
  while (ms > 0.1) {
    const step = Math.min(40, ms);
    movePlayer(state, inp, step / 1000);
    ms -= step;
  }
  state.time += total * 4;
  if (state.time >= 22 * 60 && state.time < DAY_END && !state.lateWarned) {
    state.lateWarned = true;
    showToast(state, 'toast_late');
  }
  wanderAnimals(state, total);
  wanderNpcs(state, total);
  if (state.toastT > 0) state.toastT = Math.max(0, state.toastT - total);
  checkLinks(state);
  if (state.time >= DAY_END) doPassout(state);
}

function handleInput(state, input, dt) {
  const pressed = input.pressed || {};
  if (pressed.close) {
    closePanel(state);
    return;
  }
  if (!MENU_LOCK.has(state.panel)) {
    if (pressed.inv) {
      togglePanel(state, 'inventory');
      return;
    }
    if (pressed.cal) {
      togglePanel(state, 'calendar');
      return;
    }
  }
  if (pressed.slots) {
    for (let i = 0; i < 8; i++) if (pressed.slots[i]) state.hotbar = i;
  }
  if (input.wheel) {
    const dir = input.wheel > 0 ? 1 : -1;
    state.hotbar = (state.hotbar + dir + 8) % 8;
  }
  if (state.panel === 'dialogue') {
    if (pressed.give && state.dialogue) give(state, state.dialogue.npcId, held(state)?.id);
    else if (pressed.interact) advanceDialogue(state);
    return;
  }
  if (state.panel === 'sleep') {
    if (pressed.interact) sleep(state);
    return;
  }
  if (state.panel === 'chest') {
    if (pressed.use || pressed.interact) {
      const slot = state.hotbar;
      if (state.inventory[slot]) chestMove(state, 'bag', slot);
      else {
        const idx = (state.chest || []).findIndex((s) => s);
        if (idx >= 0) chestMove(state, 'chest', idx);
      }
    }
    return;
  }
  if (state.panel === 'help' || state.panel === 'notice' || state.panel === 'passout') {
    if (pressed.interact || pressed.close) {
      if (state.panel === 'help') state.seenHelp = true;
      state.panel = null;
      state.noticeKey = null;
    }
    return;
  }
  if (state.panel) return;
  if (pressed.use) {
    useTool(state);
    state.useCd = 0.22;
  } else if (input.holdUse && holdRepeats(state)) {
    state.useCd = (state.useCd || 0) - dt;
    if (state.useCd <= 0) {
      useTool(state);
      state.useCd = 0.16;
    }
  }
  if (pressed.interact) interact(state);
}

function holdRepeats(state) {
  const id = held(state)?.id;
  return id === 'hoe' || id === 'can';
}

/** True when (x, y) is within r tiles of an NPC on the player's map. */
export function npcBlocked(state, x, y, r) {
  return npcDistance(state, x, y) < r;
}

function npcDistance(state, x, y) {
  let best = Infinity;
  const loc = state && state.location;
  for (const n of (state && state.npcs) || []) {
    if (n.map !== loc) continue;
    const d = Math.hypot(n.x - x, n.y - y);
    if (d < best) best = d;
  }
  return best;
}

function playerStepOk(state, map, x, y) {
  if (bodyBlocked(map, x, y)) return false;
  if (!npcBlocked(state, x, y, 0.6)) return true;
  // Already overlapping: allow a step that walks away so the farmer is not stuck.
  return npcDistance(state, x, y) > npcDistance(state, state.player.x, state.player.y) + 1e-4;
}

function movePlayer(state, input, dt) {
  let vx = input.x || 0;
  let vy = input.y || 0;
  if (Math.abs(vx) < 0.2) vx = 0;
  if (Math.abs(vy) < 0.2) vy = 0;
  if (!vx && !vy) {
    state.player.moving = false;
    return;
  }
  state.player.moving = true;
  const len = Math.hypot(vx, vy) || 1;
  vx /= len;
  vy /= len;
  const sp = 3.15 * dt;
  const map = getMap(state.location);
  const nx = state.player.x + vx * sp;
  if (playerStepOk(state, map, nx, state.player.y)) state.player.x = nx;
  const ny = state.player.y + vy * sp;
  if (playerStepOk(state, map, state.player.x, ny)) state.player.y = ny;
  if (Math.abs(vx) > Math.abs(vy)) state.player.dir = vx > 0 ? 'right' : 'left';
  else state.player.dir = vy > 0 ? 'down' : 'up';
  state.player.walk = (state.player.walk || 0) + dt;
}

function checkLinks(state) {
  const map = getMap(state.location);
  const x = Math.floor(state.player.x);
  const y = Math.floor(state.player.y);
  const link = findLink(map, x, y);
  if (!link) {
    state.linkLock = false;
    return;
  }
  if (state.linkLock) return;
  go(state, link.to, { x: link.sx, y: link.sy, dir: link.dir });
}

function wanderAnimals(state, dt) {
  for (const a of state.animals) {
    const pen = a.type === 'cow' ? PEN.cow : PEN.chicken;
    a.timer -= dt;
    if (a.timer <= 0) {
      a.timer = 0.7 + Math.random() * 1.4;
      a.dir = ['up', 'down', 'left', 'right', 'idle', 'idle'][Math.floor(Math.random() * 6)];
    }
    let dx = 0;
    let dy = 0;
    if (a.dir === 'left') dx = -1;
    if (a.dir === 'right') dx = 1;
    if (a.dir === 'up') dy = -1;
    if (a.dir === 'down') dy = 1;
    a.x = clamp(a.x + dx * 0.65 * dt, pen.x0, pen.x1);
    a.y = clamp(a.y + dy * 0.65 * dt, pen.y0, pen.y1);
  }
}

function wanderNpcs(state, dt) {
  for (const n of state.npcs) {
    const wps = n.waypoints || [];
    if (wps.length <= 1) continue;
    if (n.pause > 0) {
      n.pause -= dt;
      continue;
    }
    const target = wps[n.wi % wps.length];
    const dx = target.x - n.x;
    const dy = target.y - n.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.06) {
      if (npcStepBlocked(state, n, target.x, target.y)) {
        n.pause = 0.3;
        continue;
      }
      n.x = target.x;
      n.y = target.y;
      n.wi = (n.wi + 1) % wps.length;
      n.pause = 0.7 + Math.random() * 1.4;
      continue;
    }
    const step = Math.min(dist, 0.9 * dt);
    const nx = n.x + (dx / dist) * step;
    const ny = n.y + (dy / dist) * step;
    if (npcStepBlocked(state, n, nx, ny)) {
      n.pause = 0.3;
      continue;
    }
    n.x = nx;
    n.y = ny;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
}

function npcStepBlocked(state, n, x, y) {
  const map = getMap(n.map);
  if (bodyBlocked(map, x, y)) return true;
  if (n.map !== state.location) return false;
  return Math.hypot(state.player.x - x, state.player.y - y) < 0.7;
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
