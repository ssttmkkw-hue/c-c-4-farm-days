import { isSeed, seedCropId } from '../data/items.js';
import { phaseOf } from './calendar.js';
import { held } from './inventory.js';

export function snapshot(state) {
  const lang = state?.lang === 'en' ? 'en' : 'zh';
  if (!state || !state.started || !state.inventory) {
    return {
      day: 1,
      season: 'spring',
      year: 1,
      timeOfDay: 360,
      energy: 100,
      energyMax: 100,
      money: 0,
      weather: 'sunny',
      location: 'farm',
      player: { x: 0, y: 0, dir: 'down' },
      tool: null,
      selectedSeed: null,
      inventory: [],
      chest: [],
      field: [],
      animals: [],
      npcs: [],
      lang,
      paused: true,
      screen: 'title',
    };
  }
  const item = held(state);
  const tool = item ? item.id : null;
  const field = Object.values(state.plots)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((p) => ({
      x: p.x,
      y: p.y,
      tilled: !!p.tilled,
      crop: p.crop || null,
      stage: p.stage | 0,
      watered: !!p.watered,
      wilted: !!p.wilted,
    }));
  return {
    day: state.day,
    season: state.season,
    year: state.year,
    timeOfDay: state.time,
    phase: phaseOf(state.time),
    energy: state.energy,
    energyMax: state.energyMax,
    money: state.money,
    weather: state.weather,
    location: state.location,
    player: {
      x: state.player.x,
      y: state.player.y,
      dir: state.player.dir,
    },
    tool,
    selectedSeed: isSeed(tool) ? seedCropId(tool) : null,
    inventory: state.inventory
      .map((s, i) => (s ? { slot: i, id: s.id, qty: s.qty, ...(s.bonus ? { bonus: s.bonus } : {}) } : null))
      .filter(Boolean),
    chest: (Array.isArray(state.chest) ? state.chest : [])
      .map((s, i) => (s ? { slot: i, id: s.id, qty: s.qty, ...(s.bonus ? { bonus: s.bonus } : {}) } : null))
      .filter(Boolean),
    field,
    animals: state.animals.map((a) => ({
      id: a.id,
      type: a.type,
      name: lang === 'en' ? a.en : a.zh,
      fed: !!a.fed,
      mood: a.mood | 0,
      produce: a.type === 'chicken' ? (a.hasEgg ? 'egg' : null) : (a.hasMilk ? 'milk' : null),
      x: a.x,
      y: a.y,
    })),
    npcs: state.npcs.map((n) => ({
      id: n.id,
      name: lang === 'en' ? n.en : n.zh,
      hearts: state.hearts[n.id] || 0,
      x: n.x,
      y: n.y,
    })),
    lang,
    paused: !!(state.paused || state.panel === 'settings' || state.screen === 'title'),
    screen: state.screen,
    lastPayout: state.lastPayout || 0,
    canWater: state.canWater,
    canMax: state.canMax,
    shipping: state.shipping.map((s) => ({
      id: s.id,
      qty: s.qty,
      ...(s.bonus ? { bonus: s.bonus } : {}),
    })),
    weekShip: state.weekShip || 0,
  };
}
