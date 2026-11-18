import { NPC_DEFS } from '../data/dialogues.js';
import { farmPlots } from '../world/maps.js';
import { DAY_START, rollWeather } from './calendar.js';

export const ENERGY_MAX = 100;

function emptyPlots() {
  const plots = {};
  for (const p of farmPlots()) {
    plots[p.x + ',' + p.y] = {
      x: p.x,
      y: p.y,
      tilled: false,
      crop: null,
      stage: 0,
      watered: false,
      dry: 0,
      wilted: false,
    };
  }
  return plots;
}

export function createState(lang = 'zh', muted = false) {
  const inventory = Array.from({ length: 16 }, () => null);
  const start = [
    ['hand', 1],
    ['hoe', 1],
    ['can', 1],
    ['seed_turnip', 6],
    ['feed', 9],
    ['egg', 1],
    ['milk', 1],
  ];
  start.forEach(([id, qty], i) => {
    inventory[i] = { id, qty };
  });

  return {
    v: 1,
    started: true,
    screen: 'play',
    lang,
    muted: !!muted,
    touch: 'auto',
    paused: false,
    panel: null,
    seenHelp: false,
    year: 1,
    season: 'spring',
    day: 1,
    time: DAY_START,
    weather: rollWeather(1, 'spring', 1),
    energy: ENERGY_MAX,
    energyMax: ENERGY_MAX,
    money: 200,
    location: 'farm',
    player: { x: 6, y: 6, dir: 'down', walk: 0 },
    inventory,
    hotbar: 1,
    canWater: 20,
    canMax: 20,
    upgrades: { can: false, backpack: false },
    sprinklers: [],
    plots: emptyPlots(),
    shipping: [],
    lastPayout: 0,
    passPenalty: 0,
    animals: [
      { id: 'cluck', type: 'chicken', zh: '咕咕', en: 'Cluck', map: 'farm', fed: false, petted: false, hasEgg: false, mood: 4, x: 4.4, y: 8.4, dir: 'right', timer: 0.4 },
      { id: 'peck', type: 'chicken', zh: '啄啄', en: 'Peck', map: 'farm', fed: false, petted: false, hasEgg: false, mood: 4, x: 6.4, y: 8.8, dir: 'left', timer: 1.1 },
      { id: 'moo', type: 'cow', zh: '哞哞', en: 'Moo', map: 'farm', fed: false, petted: false, hasMilk: false, mood: 4, x: 15.2, y: 10.3, dir: 'right', timer: 0.2 },
    ],
    npcs: NPC_DEFS.map((d) => ({
      id: d.id,
      zh: d.zh,
      en: d.en,
      map: d.map,
      x: d.x,
      y: d.y,
      homeX: d.x,
      homeY: d.y,
      dir: 'down',
      wi: 0,
      pause: 0,
      liked: d.liked,
      disliked: d.disliked,
      look: d.look,
      waypoints: d.waypoints.map((w) => ({ x: w.x, y: w.y })),
    })),
    hearts: { hua: 0, mei: 0, lin: 0, wei: 0, tao: 0 },
    gifted: {},
    forage: {},
    dialogue: null,
    noticeKey: null,
    toast: null,
    toastT: 0,
    sfxName: null,
    sfxN: 0,
    linkLock: false,
    useCd: 0,
    lateWarned: false,
    seasonNote: false,
  };
}

export function plotAt(state, x, y) {
  return state.plots[x + ',' + y] || null;
}

export function playSfx(state, name) {
  state.sfxName = name;
  state.sfxN = (state.sfxN || 0) + 1;
}

export function showToast(state, key, vars) {
  state.toast = { key, vars: vars || null };
  state.toastT = 3.4;
}
