import { CROPS } from '../data/crops.js';
import { npcDef } from '../data/dialogues.js';
import { STR } from '../data/strings.js';
import {
  SPRINKLER_CAP,
  forageForSeason,
  isGiftable,
  isSeed,
  seedCropId,
  sellPrice,
} from '../data/items.js';
import { hashStr } from './rng.js';
import { getStock, shopOpen } from './shop.js';
import {
  DAY_END,
  DAY_START,
  lastSafePlantDay,
  nextDate,
  rollWeather,
} from './calendar.js';
import { saveGame } from './save.js';
import {
  addItem,
  canFit,
  countItem,
  equip,
  held,
  removeItem,
  shippingValue,
} from './inventory.js';
import { ENERGY_MAX, playSfx, plotAt, showToast } from './state.js';
import { findLink, getMap } from '../world/maps.js';
import { tileAt } from '../world/tiles.js';

const COST = {
  till: { e: 2, t: 8 },
  water: { e: 2, t: 8 },
  plant: { e: 1, t: 6 },
  harvest: { e: 2, t: 10 },
  milk: { e: 4, t: 12 },
  feed: { e: 1, t: 5 },
  pet: { e: 0, t: 4 },
  pickup: { e: 1, t: 5 },
  place: { e: 2, t: 8 },
};

function spendEnergy(state, n) {
  if (n <= 0) return true;
  if (state.energy < n) {
    showToast(state, 'toast_tired');
    return false;
  }
  state.energy -= n;
  if (state.energy <= 0) {
    state.energy = 0;
    state._passout = true;
  }
  return true;
}

function addMinutes(state, n) {
  state.time += n;
  if (state.time > DAY_END) state.time = DAY_END;
}

function maybePassout(state) {
  if (!state._passout) return;
  state._passout = false;
  doPassout(state);
}

export function actionTiles(state) {
  const x = Math.floor(state.player.x);
  const y = Math.floor(state.player.y);
  const d = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[state.player.dir] || [0, 1];
  return { x, y, fx: x + d[0], fy: y + d[1] };
}

export function aimTile(state) {
  return pickPlotTile(state);
}

function pickPlotTile(state) {
  const a = actionTiles(state);
  if (plotAt(state, a.fx, a.fy)) return { x: a.fx, y: a.fy };
  if (plotAt(state, a.x, a.y)) return { x: a.x, y: a.y };
  return { x: a.fx, y: a.fy };
}

function sprinklerAt(state, x, y) {
  return state.sprinklers.some((s) => s.x === x && s.y === y);
}

export function faceTile(state, x, y) {
  const px = Math.floor(state.player.x);
  const py = Math.floor(state.player.y);
  if (x === px && y === py) return;
  if (Math.abs(x - px) > Math.abs(y - py)) state.player.dir = x > px ? 'right' : 'left';
  else state.player.dir = y > py ? 'down' : 'up';
}

function clearWilted(state, plot) {
  if (!spendEnergy(state, COST.till.e)) return false;
  plot.crop = null;
  plot.stage = 0;
  plot.wilted = false;
  plot.dry = 0;
  plot.watered = false;
  plot.tilled = true;
  addMinutes(state, COST.till.t);
  playSfx(state, 'hoe');
  showToast(state, 'toast_wilt_clear');
  maybePassout(state);
  return true;
}

export function till(state) {
  const { x, y } = pickPlotTile(state);
  const plot = plotAt(state, x, y);
  if (!plot) {
    showToast(state, 'toast_no_target');
    return false;
  }
  if (sprinklerAt(state, x, y)) {
    return pickupSprinkler(state, x, y);
  }
  if (plot.crop && !plot.wilted) {
    showToast(state, 'toast_growing');
    return false;
  }
  if (plot.wilted) return clearWilted(state, plot);
  if (state.season === 'winter') {
    showToast(state, 'toast_frozen');
    return false;
  }
  if (plot.tilled) {
    showToast(state, 'toast_till');
    return true;
  }
  if (!spendEnergy(state, COST.till.e)) return false;
  plot.tilled = true;
  addMinutes(state, COST.till.t);
  playSfx(state, 'hoe');
  showToast(state, 'toast_till');
  maybePassout(state);
  return true;
}

export function water(state) {
  const { x, y } = pickPlotTile(state);
  const plot = plotAt(state, x, y);
  if (!plot || !plot.tilled || plot.wilted) {
    showToast(state, 'toast_no_target');
    return false;
  }
  if (state.canWater <= 0) {
    showToast(state, 'toast_no_water');
    return false;
  }
  if (plot.watered) {
    showToast(state, 'toast_water');
    return true;
  }
  if (!spendEnergy(state, COST.water.e)) return false;
  state.canWater -= 1;
  plot.watered = true;
  plot.dry = 0;
  addMinutes(state, COST.water.t);
  playSfx(state, 'water');
  showToast(state, 'toast_water');
  maybePassout(state);
  return true;
}

export function plant(state, cropId) {
  const id = cropId || seedCropId(held(state)?.id || '');
  const def = CROPS[id];
  if (!def) {
    showToast(state, 'toast_no_seed');
    return false;
  }
  if (state.season !== def.season) {
    showToast(state, 'toast_wrong_season');
    return false;
  }
  const seedId = 'seed_' + id;
  if (countItem(state, seedId) < 1) {
    showToast(state, 'toast_no_seed');
    return false;
  }
  const { x, y } = pickPlotTile(state);
  const plot = plotAt(state, x, y);
  if (!plot) {
    showToast(state, 'toast_no_target');
    return false;
  }
  if (sprinklerAt(state, x, y)) {
    showToast(state, 'toast_no_target');
    return false;
  }
  if (!plot.tilled) {
    showToast(state, 'toast_need_till');
    return false;
  }
  if (plot.crop) {
    showToast(state, 'toast_has_crop');
    return false;
  }
  if (!spendEnergy(state, COST.plant.e)) return false;
  if (!removeItem(state, seedId, 1)) return false;
  plot.crop = id;
  plot.stage = 0;
  plot.wilted = false;
  plot.dry = 0;
  plot.watered = false;
  addMinutes(state, COST.plant.t);
  playSfx(state, 'plant');
  const last = lastSafePlantDay(def.days);
  if (state.day > last) showToast(state, 'toast_late_plant', { name: id, day: last });
  else showToast(state, 'toast_plant', { name: id });
  maybePassout(state);
  return true;
}

export function harvest(state, quiet) {
  const { x, y } = pickPlotTile(state);
  const plot = plotAt(state, x, y);
  if (!plot || !plot.crop || plot.wilted) {
    if (!quiet) showToast(state, 'toast_nothing');
    return false;
  }
  const def = CROPS[plot.crop];
  if (!def || plot.stage < def.days) {
    if (!quiet) showToast(state, 'toast_not_ready');
    return false;
  }
  if (!canFit(state, plot.crop, 1)) {
    showToast(state, 'toast_full');
    return false;
  }
  if (!spendEnergy(state, COST.harvest.e)) return false;
  const cropId = plot.crop;
  addItem(state, cropId, 1);
  if (def.regrow && state.season === def.season) {
    plot.stage = def.days - def.regrow;
    plot.watered = false;
    plot.dry = 0;
    plot.wilted = false;
  } else {
    plot.crop = null;
    plot.stage = 0;
    plot.dry = 0;
    plot.wilted = false;
    plot.watered = false;
  }
  addMinutes(state, COST.harvest.t);
  playSfx(state, 'harvest');
  showToast(state, 'toast_harvest', { name: cropId });
  maybePassout(state);
  return true;
}

export function refillCan(state) {
  state.canWater = state.canMax;
  playSfx(state, 'water');
  showToast(state, 'toast_filled');
  return true;
}

function placeSprinkler(state) {
  if (state.location !== 'farm') {
    showToast(state, 'toast_no_target');
    return false;
  }
  const a = actionTiles(state);
  let x = a.fx;
  let y = a.fy;
  const map = getMap(state.location);
  const front = tileAt(map, a.fx, a.fy);
  const under = tileAt(map, a.x, a.y);
  if (front === '#' || front === 'T' || front === '~' || front === 'H' || front === '=') {
    x = a.x;
    y = a.y;
  }
  const ch = tileAt(map, x, y);
  if ('T#~=HwoXcBPkD'.includes(ch)) {
    showToast(state, 'toast_no_target');
    return false;
  }
  if (sprinklerAt(state, x, y)) {
    showToast(state, 'toast_sprinkler_cap');
    return false;
  }
  if (state.sprinklers.length >= SPRINKLER_CAP) {
    showToast(state, 'toast_sprinkler_cap');
    return false;
  }
  const plot = plotAt(state, x, y);
  if (plot && plot.crop) {
    showToast(state, 'toast_has_crop');
    return false;
  }
  if (countItem(state, 'sprinkler') < 1) return false;
  if (!spendEnergy(state, COST.place.e)) return false;
  if (!removeItem(state, 'sprinkler', 1)) return false;
  state.sprinklers.push({ x, y });
  addMinutes(state, COST.place.t);
  playSfx(state, 'place');
  showToast(state, 'toast_sprinkler');
  maybePassout(state);
  return true;
}

function pickupSprinkler(state, x, y) {
  const i = state.sprinklers.findIndex((s) => s.x === x && s.y === y);
  if (i < 0) return false;
  if (!canFit(state, 'sprinkler', 1)) {
    showToast(state, 'toast_full');
    return false;
  }
  state.sprinklers.splice(i, 1);
  addItem(state, 'sprinkler', 1);
  playSfx(state, 'pickup');
  showToast(state, 'toast_pickup_sp');
  return true;
}

export function useTool(state) {
  const item = held(state);
  if (!item) {
    showToast(state, 'toast_nothing');
    return false;
  }
  if (item.id === 'hoe') return till(state);
  if (item.id === 'can') return water(state);
  if (isSeed(item.id)) return plant(state, seedCropId(item.id));
  if (item.id === 'sprinkler') return placeSprinkler(state);
  if (item.id === 'feed') {
    const animal = nearestAnimal(state, 1.8);
    if (!animal) {
      showToast(state, 'toast_no_animal');
      return false;
    }
    return feed(state, animal.id);
  }
  if (item.id === 'hand') {
    const spot = pickPlotTile(state);
    const under = plotAt(state, spot.x, spot.y);
    if (under && under.wilted) return clearWilted(state, under);
    if (harvest(state, true)) return true;
    const a = actionTiles(state);
    if (tryForage(state, a.fx, a.fy) || tryForage(state, a.x, a.y)) return true;
    const sp = sprinklerTarget(state);
    if (sp) return pickupSprinkler(state, sp.x, sp.y);
    showToast(state, 'toast_nothing');
    return false;
  }
  showToast(state, 'toast_nothing');
  return false;
}

function sprinklerTarget(state) {
  const a = actionTiles(state);
  if (sprinklerAt(state, a.fx, a.fy)) return { x: a.fx, y: a.fy };
  if (sprinklerAt(state, a.x, a.y)) return { x: a.x, y: a.y };
  return null;
}

function tryForage(state, x, y) {
  const map = getMap(state.location);
  if (tileAt(map, x, y) !== 'f') return false;
  const key = state.location + ':' + x + ',' + y;
  if (state.forage[key]) {
    showToast(state, 'toast_forage_gone');
    return true;
  }
  const id = forageForSeason(state.season);
  if (!canFit(state, id, 1)) {
    showToast(state, 'toast_full');
    return true;
  }
  if (!spendEnergy(state, COST.pickup.e)) return true;
  addItem(state, id, 1);
  state.forage[key] = true;
  addMinutes(state, COST.pickup.t);
  playSfx(state, 'pickup');
  showToast(state, 'toast_forage', { name: id });
  maybePassout(state);
  return true;
}

export function nearestAnimal(state, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const a of state.animals) {
    if (a.map !== state.location) continue;
    const d = Math.hypot(a.x + 0.5 - (state.player.x + 0.5), a.y + 0.5 - (state.player.y + 0.5));
    if (d <= bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

export function nearestNpc(state, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const n of state.npcs) {
    if (n.map !== state.location) continue;
    const d = Math.hypot(n.x + 0.5 - (state.player.x + 0.5), n.y + 0.5 - (state.player.y + 0.5));
    if (d <= bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

function animalById(state, id) {
  return state.animals.find((a) => a.id === id) || null;
}

export function feed(state, animalId) {
  const a = animalById(state, animalId);
  if (!a) return false;
  if (a.fed) {
    showToast(state, 'toast_already_fed', { name: a.id });
    return false;
  }
  if (countItem(state, 'feed') < 1) {
    showToast(state, 'toast_no_feed');
    return false;
  }
  if (!spendEnergy(state, COST.feed.e)) return false;
  removeItem(state, 'feed', 1);
  a.fed = true;
  a.mood = Math.min(5, (a.mood || 0) + 1);
  addMinutes(state, COST.feed.t);
  playSfx(state, a.type === 'cow' ? 'cow' : 'chicken');
  showToast(state, 'toast_fed', { name: a.id });
  maybePassout(state);
  return true;
}

export function pet(state, animalId) {
  const a = animalById(state, animalId);
  if (!a) return false;
  if (a.petted) {
    showToast(state, 'toast_already_pet', { name: a.id });
    return true;
  }
  a.petted = true;
  a.mood = Math.min(5, (a.mood || 0) + 1);
  addMinutes(state, COST.pet.t);
  playSfx(state, a.type === 'cow' ? 'cow' : 'chicken');
  showToast(state, 'toast_pet', { name: a.id });
  return true;
}

export function milk(state, animalId) {
  const a = animalById(state, animalId || 'moo');
  if (!a || a.type !== 'cow') return false;
  if (!a.hasMilk) {
    showToast(state, 'toast_no_milk');
    return false;
  }
  if (!canFit(state, 'milk', 1)) {
    showToast(state, 'toast_full');
    return false;
  }
  if (!spendEnergy(state, COST.milk.e)) return false;
  addItem(state, 'milk', 1);
  a.hasMilk = false;
  addMinutes(state, COST.milk.t);
  playSfx(state, 'cow');
  showToast(state, 'toast_milk');
  maybePassout(state);
  return true;
}

export function collectEgg(state, animalId) {
  const a = animalById(state, animalId);
  if (!a || a.type !== 'chicken') return false;
  if (!a.hasEgg) {
    showToast(state, 'toast_no_egg');
    return false;
  }
  if (!canFit(state, 'egg', 1)) {
    showToast(state, 'toast_full');
    return false;
  }
  if (!spendEnergy(state, COST.pickup.e)) return false;
  addItem(state, 'egg', 1);
  a.hasEgg = false;
  addMinutes(state, COST.pickup.t);
  playSfx(state, 'chicken');
  showToast(state, 'toast_egg');
  maybePassout(state);
  return true;
}

function animalInteract(state, a) {
  if (a.type === 'chicken') {
    if (a.hasEgg) return collectEgg(state, a.id);
    return pet(state, a.id);
  }
  if (a.hasMilk) return milk(state, a.id);
  return pet(state, a.id);
}

function bumpHeart(state, npcId, amount) {
  const next = Math.round(((state.hearts[npcId] || 0) + amount) * 2) / 2;
  state.hearts[npcId] = Math.min(5, Math.max(0, next));
}

function rewardItem(state, npcId) {
  if (npcId === 'hua') {
    const crop = Object.values(CROPS).find((c) => c.season === state.season);
    return crop ? 'seed_' + crop.id : 'cocoa';
  }
  if (npcId === 'tao') return 'pumpkin_cake';
  if (npcId === 'mei') return 'turnip';
  return null;
}

function grantVisitReward(state, npcId) {
  if ((state.hearts[npcId] || 0) < 4) return false;
  if (!state.rewards || typeof state.rewards !== 'object') state.rewards = {};
  if (state.rewards[npcId]) return false;
  const id = rewardItem(state, npcId);
  if (!id || !canFit(state, id, 1)) return false;
  addItem(state, id, 1);
  state.rewards[npcId] = true;
  const key = npcId === 'hua' ? 'toast_reward_hua' : npcId === 'tao' ? 'toast_reward_tao' : 'toast_reward_mei';
  showToast(state, key, { name: id });
  return true;
}

function dialogueLine(key) {
  const row = STR[key];
  return [{ zh: row.zh, en: row.en }];
}

export function talk(state, npcId) {
  const def = npcDef(npcId);
  const npc = state.npcs.find((n) => n.id === npcId);
  if (!def || !npc) return false;
  if (!state.talked || typeof state.talked !== 'object') state.talked = {};
  if (!state.talked[npcId]) {
    state.talked[npcId] = true;
    bumpHeart(state, npcId, 0.5);
  }
  const hearts = state.hearts[npcId] || 0;
  const tier = hearts >= 4 ? 'high' : hearts >= 2 ? 'mid' : 'low';
  const variants = def.lines[tier];
  const pick = variants[(state.day + hashStr(npcId)) % variants.length];
  state.dialogue = { npcId, pages: pick, page: 0 };
  state.panel = 'dialogue';
  addMinutes(state, 6);
  playSfx(state, 'talk');
  grantVisitReward(state, npcId);
  return true;
}

export function advanceDialogue(state) {
  if (!state.dialogue) {
    state.panel = null;
    return false;
  }
  state.dialogue.page += 1;
  if (state.dialogue.page >= state.dialogue.pages.length) {
    state.dialogue = null;
    state.panel = null;
  }
  return true;
}

export function give(state, npcId, itemId) {
  const npc = state.npcs.find((n) => n.id === npcId);
  if (!npc) return false;
  const id = itemId || held(state)?.id;
  if (!id || !isGiftable(id)) {
    showToast(state, 'toast_gift_none');
    return false;
  }
  if (!state.gifted || typeof state.gifted !== 'object') state.gifted = {};
  if (state.gifted[npcId]) {
    showToast(state, 'toast_gift_already');
    return false;
  }
  if (countItem(state, id) < 1) {
    showToast(state, 'toast_gift_none');
    return false;
  }
  if (id === npc.disliked) {
    playSfx(state, 'talk');
    showToast(state, 'toast_gift_disliked');
    state.panel = 'dialogue';
    state.dialogue = { npcId, pages: dialogueLine('dlg_gift_keep'), page: 0 };
    return false;
  }
  if (!removeItem(state, id, 1)) return false;
  state.gifted[npcId] = true;
  const liked = id === npc.liked;
  if (liked) bumpHeart(state, npcId, 1);
  playSfx(state, 'gift');
  addMinutes(state, 8);
  const rewarded = grantVisitReward(state, npcId);
  if (!rewarded) showToast(state, liked ? 'toast_gift_liked' : 'toast_gift_neutral');
  state.panel = 'dialogue';
  state.dialogue = { npcId, pages: dialogueLine(liked ? 'dlg_gift_liked' : 'dlg_gift_thanks'), page: 0 };
  return true;
}

export function buy(state, itemId, qty) {
  let q = Math.floor(Number(qty) || 1);
  if (q < 1) q = 1;
  const stock = getStock(state);
  const offer = stock.find((s) => s.id === itemId);
  if (!offer) {
    showToast(state, 'toast_not_stock');
    return false;
  }
  if (offer.upgrade && offer.owned) return false;
  if (offer.upgrade) q = 1;
  const cost = offer.price * q;
  if (state.money < cost) {
    showToast(state, 'toast_no_money');
    return false;
  }
  if (!state.upgrades) state.upgrades = {};
  if (itemId === 'upgrade_can') {
    state.upgrades.can = true;
    state.canMax = 40;
    state.canWater = 40;
    state.money -= offer.price;
    playSfx(state, 'coin');
    showToast(state, 'toast_bought_can');
    saveGame(state);
    return true;
  }
  if (itemId === 'upgrade_bag') {
    state.upgrades.backpack = true;
    while (state.inventory.length < 24) state.inventory.push(null);
    state.money -= offer.price;
    playSfx(state, 'coin');
    showToast(state, 'toast_bought_bag');
    saveGame(state);
    return true;
  }
  if (itemId === 'upgrade_coop') {
    state.upgrades.coop = true;
    state.money -= offer.price;
    playSfx(state, 'coin');
    showToast(state, 'toast_bought_coop');
    saveGame(state);
    return true;
  }
  if (itemId === 'upgrade_hearth') {
    state.upgrades.hearth = true;
    state.money -= offer.price;
    playSfx(state, 'coin');
    showToast(state, 'toast_bought_hearth');
    saveGame(state);
    return true;
  }
  if (itemId === 'sprinkler') {
    const have = countItem(state, 'sprinkler') + state.sprinklers.length;
    if (have >= SPRINKLER_CAP) {
      showToast(state, 'toast_sprinkler_cap');
      return false;
    }
    q = Math.min(q, SPRINKLER_CAP - have);
  }
  if (!canFit(state, itemId, q)) {
    showToast(state, 'toast_full');
    return false;
  }
  state.money -= offer.price * q;
  addItem(state, itemId, q);
  playSfx(state, 'coin');
  showToast(state, 'toast_bought', { name: itemId });
  return true;
}

export function shipSlot(state, slot) {
  const item = state.inventory[slot];
  if (!item) return false;
  const price = sellPrice(item.id);
  if (!price) {
    showToast(state, 'toast_no_sell');
    return false;
  }
  const found = state.shipping.find((s) => s.id === item.id);
  if (found) found.qty += item.qty;
  else state.shipping.push({ id: item.id, qty: item.qty });
  state.inventory[slot] = null;
  if (state.hotbar === slot) {
    /* keep index */
  }
  playSfx(state, 'ship');
  showToast(state, 'toast_shipped');
  return true;
}

export function collectShipping(state) {
  const slot = state.hotbar;
  return shipSlot(state, slot);
}

export function unship(state, index) {
  const s = state.shipping[index];
  if (!s) return false;
  if (!canFit(state, s.id, s.qty)) {
    showToast(state, 'toast_full');
    return false;
  }
  addItem(state, s.id, s.qty);
  state.shipping.splice(index, 1);
  playSfx(state, 'pickup');
  return true;
}

function waterFromSky(state) {
  if (state.weather === 'rain') {
    for (const p of Object.values(state.plots)) {
      if (p.tilled && p.crop && !p.wilted) p.watered = true;
    }
  }
  for (const sp of state.sprinklers) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const p = plotAt(state, sp.x + dx, sp.y + dy);
        if (p && p.tilled && p.crop && !p.wilted) p.watered = true;
      }
    }
  }
}

export function endDay(state, reason) {
  let gold = shippingValue(state);
  state.shipping = [];
  state.money += gold;
  state.lastPayout = gold;

  let wilted = 0;
  for (const p of Object.values(state.plots)) {
    if (!p.crop || p.wilted || !p.tilled) {
      p.watered = false;
      continue;
    }
    const def = CROPS[p.crop];
    if (!def) continue;
    if (p.watered) {
      p.dry = 0;
      if (p.stage < def.days) p.stage += 1;
    } else {
      p.dry += 1;
      if (p.dry >= 2) {
        p.wilted = true;
        wilted += 1;
      }
    }
    p.watered = false;
  }

  for (const a of state.animals) {
    if (a.type === 'chicken' && a.fed) a.hasEgg = true;
    if (a.type === 'cow' && a.fed) a.hasMilk = true;
    if (!a.fed) a.mood = Math.max(2, a.mood || 2);
    a.fed = false;
    a.petted = false;
  }

  const date = nextDate(state.year, state.season, state.day);
  state.year = date.year;
  state.season = date.season;
  state.day = date.day;
  state.seasonNote = date.changed;

  for (const p of Object.values(state.plots)) {
    if (!p.crop || p.wilted) continue;
    const def = CROPS[p.crop];
    if (def && p.stage < def.days && def.season !== state.season) {
      p.wilted = true;
      wilted += 1;
    }
  }

  state.weather = rollWeather(state.year, state.season, state.day);
  waterFromSky(state);
  state.energy = state.energyMax || ENERGY_MAX;
  state.time = DAY_START;
  state.gifted = {};
  state.talked = {};
  state.forage = {};
  state.lateWarned = false;
  state.passPenalty = 0;
  if (reason === 'passout') {
    const pen = Math.min(80, Math.floor(state.money * 0.1));
    state.money -= pen;
    state.passPenalty = pen;
  }
  if (reason !== 'passout') {
    if (gold > 0) showToast(state, 'toast_morning', { gold });
    else if (wilted > 0) showToast(state, 'toast_wilted');
    else if (date.changed) showToast(state, 'toast_season', { name: state.season });
    else showToast(state, 'toast_morning_zero');
  }
  playSfx(state, 'sleep');
  return true;
}

export function sleep(state) {
  endDay(state, 'sleep');
  state.panel = null;
  state.dialogue = null;
  state.paused = false;
  saveGame(state);
  return true;
}

export function doPassout(state) {
  if (state._passing) return;
  state._passing = true;
  endDay(state, 'passout');
  state.location = 'house';
  state.player.x = 5;
  state.player.y = 6;
  state.player.dir = 'down';
  state.linkLock = true;
  state.panel = 'passout';
  state.dialogue = null;
  state.paused = false;
  state._passing = false;
  saveGame(state);
}

export function go(state, location, spawn) {
  const aliases = { forest: 'path' };
  const id = aliases[location] || location;
  const map = getMap(id);
  if (!map || (id !== 'farm' && id !== 'village' && id !== 'path' && id !== 'house' && id !== 'shop')) {
    return false;
  }
  state.location = id;
  const sp = spawn || map.spawn;
  state.player.x = sp.x;
  state.player.y = sp.y;
  if (sp.dir) state.player.dir = sp.dir;
  state.linkLock = true;
  state.panel = null;
  state.dialogue = null;
  state.paused = false;
  return true;
}

export function teleport(state, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const map = getMap(state.location);
  state.player.x = Math.max(0, Math.min(map.w - 1, x));
  state.player.y = Math.max(0, Math.min(map.h - 1, y));
  return true;
}

export function interact(state) {
  if (state.panel === 'dialogue') return advanceDialogue(state);
  if (state.panel === 'sleep') return sleep(state);
  if (state.panel === 'help' || state.panel === 'notice' || state.panel === 'passout') {
    state.panel = null;
    state.noticeKey = null;
    return true;
  }
  if (state.panel) return false;

  const map = getMap(state.location);
  const a = actionTiles(state);
  const faced = tileObject(state, map, a.fx, a.fy, false);
  if (faced) return true;
  const npc = nearestNpc(state, 2.35);
  if (npc) return talk(state, npc.id);
  const animal = nearestAnimal(state, 1.7);
  if (animal) return animalInteract(state, animal);
  const under = tileObject(state, map, a.x, a.y, true);
  if (under) return true;
  showToast(state, 'toast_nothing');
  return false;
}

function tileObject(state, map, x, y, standing) {
  const ch = tileAt(map, x, y);
  const link = findLink(map, x, y);
  if (link && !standing) {
    go(state, link.to, { x: link.sx, y: link.sy, dir: link.dir });
    return true;
  }
  if (ch === 'B') {
    state.panel = 'sleep';
    playSfx(state, 'ui');
    return true;
  }
  if (ch === 'X') {
    state.panel = 'shipping';
    playSfx(state, 'ui');
    return true;
  }
  if (ch === 'c') {
    state.panel = 'inventory';
    playSfx(state, 'ui');
    return true;
  }
  if (ch === 'w') {
    refillCan(state);
    return true;
  }
  if (ch === 'k') {
    if (!shopOpen(state)) {
      showToast(state, 'toast_shop_night');
      return true;
    }
    state.panel = 'shop';
    playSfx(state, 'ui');
    return true;
  }
  if (ch === 'P') {
    state.panel = 'notice';
    state.noticeKey = 'board_' + state.season;
    playSfx(state, 'ui');
    return true;
  }
  if (ch === 'f') return tryForage(state, x, y);
  const plot = plotAt(state, x, y);
  if (plot && plot.crop && !plot.wilted && CROPS[plot.crop]) {
    if (plot.stage >= CROPS[plot.crop].days) harvest(state);
    else showToast(state, 'toast_not_ready');
    return true;
  }
  return false;
}

const SIGN_TILE = {
  w: 'well',
  X: 'bin',
  B: 'bed',
  k: 'counter',
  c: 'chest',
  P: 'board',
};

export function hintTile(state) {
  if (!state?.player || state.panel || state.screen !== 'play') return null;
  const map = getMap(state.location);
  const a = actionTiles(state);
  const indoor = state.location === 'house' || state.location === 'shop';
  const spots = [[a.fx, a.fy], [a.x, a.y]];
  for (const [x, y] of spots) {
    const ch = tileAt(map, x, y);
    if (SIGN_TILE[ch]) return { x, y, id: SIGN_TILE[ch] };
    if (ch === 'D') return { x, y, id: indoor ? 'exit' : 'enter' };
    if (findLink(map, x, y)) return { x, y, id: 'exit' };
  }
  const npc = nearestNpc(state, 1.7);
  if (npc) return { x: npc.x, y: npc.y, id: 'talk', float: true };
  const animal = nearestAnimal(state, 1.55);
  if (animal) return { x: animal.x, y: animal.y, id: animal.type === 'cow' ? 'cow' : 'hen', float: true };
  const plot = plotAt(state, a.fx, a.fy) || plotAt(state, a.x, a.y);
  if (plot && plot.crop && !plot.wilted) {
    const def = CROPS[plot.crop];
    if (def && plot.stage >= def.days) return { x: plot.x, y: plot.y, id: 'harvest', float: true };
  }
  return null;
}

export function togglePanel(state, name) {
  if (state.panel === name) {
    state.panel = null;
    state.paused = false;
    state.dialogue = null;
    return;
  }
  state.dialogue = null;
  state.panel = name;
  state.paused = name === 'settings';
  playSfx(state, 'ui');
}

export function closePanel(state) {
  if (state.panel) {
    if (state.panel === 'help') state.seenHelp = true;
    state.panel = null;
    state.dialogue = null;
    state.noticeKey = null;
    state.paused = false;
    return true;
  }
  state.panel = 'settings';
  state.paused = true;
  playSfx(state, 'ui');
  return true;
}

export { equip, held, shippingValue };
