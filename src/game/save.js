import { createState, ENERGY_MAX } from './state.js';
import { clampAnimal } from './pens.js';

const SAVE_KEY = 'farm-days-save-v1';
const SETTINGS_KEY = 'farm-days-settings-v1';

function storage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function loadSettings() {
  const ls = storage();
  const fallback = { lang: 'zh', muted: false, touch: 'auto' };
  if (!ls) return fallback;
  try {
    const raw = ls.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return {
      lang: data.lang === 'en' ? 'en' : 'zh',
      muted: !!data.muted,
      touch: data.touch === 'on' || data.touch === 'off' ? data.touch : 'auto',
    };
  } catch {
    return fallback;
  }
}

export function writeSettings(settings) {
  const ls = storage();
  if (!ls) return false;
  try {
    ls.setItem(SETTINGS_KEY, JSON.stringify({
      lang: settings.lang === 'en' ? 'en' : 'zh',
      muted: !!settings.muted,
      touch: settings.touch || 'auto',
    }));
    return true;
  } catch {
    return false;
  }
}

export function hasSave() {
  const ls = storage();
  if (!ls) return false;
  try {
    return !!ls.getItem(SAVE_KEY);
  } catch {
    return false;
  }
}

export function saveGame(state) {
  const ls = storage();
  if (!ls || !state || !state.started) return false;
  try {
    const copy = JSON.parse(JSON.stringify(state));
    copy.panel = null;
    copy.dialogue = null;
    copy.paused = false;
    copy.screen = 'play';
    copy.toast = null;
    copy.toastT = 0;
    copy.v = 2;
    ls.setItem(SAVE_KEY, JSON.stringify(copy));
    writeSettings(copy);
    return true;
  } catch {
    return false;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function waypointList(list, fallback) {
  if (!Array.isArray(list) || !list.length) return fallback.map((w) => ({ x: w.x, y: w.y }));
  const cleaned = [];
  for (const w of list) {
    const x = Number(w && w.x);
    const y = Number(w && w.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return fallback.map((p) => ({ x: p.x, y: p.y }));
    cleaned.push({ x, y });
  }
  return cleaned;
}

/**
 * Fill a version 1 or 2 save from current defaults.
 * Re-clamps animals into their pens and restores NPC waypoints.
 * Returns the same object, or null when the save cannot be played.
 */
export function migrate(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.v !== 1 && data.v !== 2) return null;
  if (!data.plots || typeof data.plots !== 'object' || !data.player) return null;
  if (!Array.isArray(data.inventory)) return null;

  const hadSeen = Object.prototype.hasOwnProperty.call(data, 'seenHelp');
  const fresh = createState(data.lang === 'en' ? 'en' : 'zh', !!data.muted);

  for (const key of Object.keys(fresh)) {
    if (data[key] === undefined) data[key] = clone(fresh[key]);
  }

  data.upgrades = {
    ...fresh.upgrades,
    ...(data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : {}),
  };
  data.hearts = {
    ...fresh.hearts,
    ...(data.hearts && typeof data.hearts === 'object' ? data.hearts : {}),
  };
  if (!data.gifted || typeof data.gifted !== 'object' || Array.isArray(data.gifted)) data.gifted = {};
  if (!data.talked || typeof data.talked !== 'object' || Array.isArray(data.talked)) data.talked = {};
  if (!data.rewards || typeof data.rewards !== 'object' || Array.isArray(data.rewards)) data.rewards = {};
  if (!data.forage || typeof data.forage !== 'object' || Array.isArray(data.forage)) data.forage = {};
  if (!Array.isArray(data.sprinklers)) data.sprinklers = [];
  if (!Array.isArray(data.shipping)) data.shipping = [];
  if (!Number.isFinite(data.energyMax) || data.energyMax <= 0) data.energyMax = ENERGY_MAX;
  if (!Number.isFinite(data.energy)) data.energy = data.energyMax;
  if (!Number.isFinite(data.money)) data.money = 0;
  if (!Number.isFinite(data.canWater)) data.canWater = fresh.canWater;
  if (!Number.isFinite(data.canMax)) data.canMax = fresh.canMax;
  if (!Number.isFinite(data.hotbar)) data.hotbar = 1;
  data.hotbar = Math.max(0, Math.min(7, data.hotbar | 0));
  if (!hadSeen) data.seenHelp = true;

  while (data.inventory.length < 16) data.inventory.push(null);
  if (data.upgrades.backpack) {
    while (data.inventory.length < 24) data.inventory.push(null);
  }

  for (const plot of Object.values(data.plots)) {
    if (!plot || typeof plot !== 'object') continue;
    if (plot.tilled === undefined) plot.tilled = false;
    if (plot.crop === undefined) plot.crop = null;
    if (plot.stage === undefined) plot.stage = 0;
    if (plot.watered === undefined) plot.watered = false;
    if (plot.dry === undefined) plot.dry = 0;
    if (plot.wilted === undefined) plot.wilted = false;
  }

  const oldAnimals = Array.isArray(data.animals) ? data.animals : [];
  const known = new Set();
  const animals = fresh.animals.map((base) => {
    known.add(base.id);
    const old = oldAnimals.find((a) => a && a.id === base.id) || {};
    const animal = { ...base, ...old, id: base.id, type: old.type || base.type };
    if (!Number.isFinite(Number(animal.timer))) animal.timer = base.timer;
    if (animal.fed == null) animal.fed = false;
    if (animal.petted == null) animal.petted = false;
    if (!Number.isFinite(Number(animal.mood))) animal.mood = base.mood;
    return clampAnimal(animal);
  });
  for (const old of oldAnimals) {
    if (!old || !old.id || known.has(old.id)) continue;
    const animal = { ...old };
    if (!animal.type) animal.type = 'chicken';
    animals.push(clampAnimal(animal));
  }
  data.animals = animals;

  const oldNpcs = Array.isArray(data.npcs) ? data.npcs : [];
  const npcIds = new Set();
  const npcs = fresh.npcs.map((base) => {
    npcIds.add(base.id);
    const old = oldNpcs.find((n) => n && n.id === base.id) || {};
    const npc = { ...base, ...old, id: base.id };
    if (!Number.isFinite(Number(npc.x))) npc.x = base.x;
    if (!Number.isFinite(Number(npc.y))) npc.y = base.y;
    if (!Number.isFinite(Number(npc.homeX))) npc.homeX = base.homeX;
    if (!Number.isFinite(Number(npc.homeY))) npc.homeY = base.homeY;
    if (!Number.isFinite(Number(npc.pause))) npc.pause = 0;
    if (!Number.isFinite(Number(npc.wi))) npc.wi = 0;
    npc.waypoints = waypointList(npc.waypoints, base.waypoints);
    return npc;
  });
  for (const old of oldNpcs) {
    if (!old || !old.id || npcIds.has(old.id)) continue;
    const npc = { ...old };
    if (!Number.isFinite(Number(npc.x))) npc.x = 2;
    if (!Number.isFinite(Number(npc.y))) npc.y = 2;
    npc.waypoints = waypointList(npc.waypoints, [{ x: npc.x, y: npc.y }]);
    npcs.push(npc);
  }
  data.npcs = npcs;

  data.v = 2;
  return data;
}

export function loadGame() {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const migrated = migrate(data);
    if (!migrated) return null;
    migrated.panel = null;
    migrated.dialogue = null;
    migrated.paused = false;
    migrated.screen = 'play';
    migrated.started = true;
    migrated.toast = null;
    migrated.toastT = 0;
    migrated.linkLock = false;
    return migrated;
  } catch {
    return null;
  }
}

export function clearSave() {
  const ls = storage();
  if (!ls) return;
  try { ls.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
