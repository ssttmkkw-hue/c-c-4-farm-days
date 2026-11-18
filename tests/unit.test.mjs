import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = {
  getItem(key) {
    return mem.has(key) ? mem.get(key) : null;
  },
  setItem(key, value) {
    mem.set(key, String(value));
  },
  removeItem(key) {
    mem.delete(key);
  },
};

const { STR } = await import('../src/data/strings.js');
const { CROPS } = await import('../src/data/crops.js');
const { FEED_PRICE, sellPrice } = await import('../src/data/items.js');
const { createState } = await import('../src/game/state.js');
const { PEN } = await import('../src/game/pens.js');
const { migrate, loadGame, saveGame } = await import('../src/game/save.js');
const { aimTile, buy, endDay, give, plant, sleep, talk, till, useTool } = await import('../src/game/actions.js');
const { update } = await import('../src/game/sim.js');

function face(state, x, y, dir) {
  state.player.x = x + 0.2;
  state.player.y = y + 0.2;
  state.player.dir = dir;
  state.player.walk = 0;
}

function qty(state, id) {
  const slot = state.inventory.find((item) => item && item.id === id);
  return slot ? slot.qty : 0;
}

// Smoke: stand on plot A, face plot B, till B only.
{
  const state = createState();
  face(state, 24, 8, 'right');
  state.hotbar = 1;
  assert.deepEqual(aimTile(state), { x: 25, y: 8 });
  assert.equal(till(state), true);
  assert.equal(state.plots['25,8'].tilled, true);
  assert.equal(state.plots['24,8'].tilled, false);
}

// Faced tile is not soil, so the plot underfoot is the fallback.
{
  const state = createState();
  face(state, 23, 8, 'left');
  state.hotbar = 1;
  assert.equal(till(state), true);
  assert.equal(state.plots['23,8'].tilled, true);
  assert.equal(Boolean(state.plots['22,8']), false);
}

// Version 1 saves gain defaults, pens, and waypoints.
{
  const raw = createState();
  raw.v = 1;
  delete raw.sprinklers;
  delete raw.energyMax;
  delete raw.forage;
  delete raw.gifted;
  delete raw.talked;
  delete raw.rewards;
  delete raw.seenHelp;
  raw.upgrades = { can: true, backpack: false };
  raw.animals[2].x = 0;
  raw.animals[2].y = 0;
  raw.npcs[0].waypoints = [];
  const out = migrate(raw);
  assert.equal(out.v, 2);
  assert.ok(Array.isArray(out.sprinklers));
  assert.equal(out.energyMax, 100);
  assert.equal(out.upgrades.can, true);
  assert.equal(out.upgrades.coop, false);
  assert.equal(out.seenHelp, true);
  assert.ok(out.animals[2].x >= PEN.cow.x0 && out.animals[2].x <= PEN.cow.x1);
  assert.ok(out.animals[2].y >= PEN.cow.y0 && out.animals[2].y <= PEN.cow.y1);
  assert.ok(out.npcs[0].waypoints.length >= 2);
  assert.ok(out.npcs[0].waypoints.every((w) => Number.isFinite(w.x) && Number.isFinite(w.y)));
  mem.clear();
  localStorage.setItem('farm-days-save-v1', JSON.stringify(out));
  const loaded = loadGame();
  assert.equal(loaded.v, 2);
  assert.equal(loaded.energyMax, 100);
}

// A full-width turnip row nets about 1.5× an animal-only day.
{
  assert.equal(sellPrice('egg'), 35);
  assert.equal(sellPrice('milk'), 90);
  const animalNet = 2 * sellPrice('egg') + sellPrice('milk') - 3 * FEED_PRICE;
  const turnip = CROPS.turnip;
  const rowNet = (8 / turnip.days) * (turnip.sell - turnip.seed);
  const ratio = rowNet / animalNet;
  assert.ok(ratio >= 1.4 && ratio <= 1.7, 'row/animal ratio ' + ratio);
  assert.ok(CROPS.cabbage.sell > 110);
  assert.ok(sellPrice('egg') < 60);
}

// Talking once a day is half a heart. A second talk does not stack. Gifts stay once a day.
{
  const state = createState();
  assert.equal(talk(state, 'mei'), true);
  assert.equal(state.hearts.mei, 0.5);
  assert.equal(talk(state, 'mei'), true);
  assert.equal(state.hearts.mei, 0.5);
  const eggs = qty(state, 'egg');
  assert.equal(give(state, 'mei', 'egg'), true);
  assert.equal(give(state, 'mei', 'egg'), false);
  assert.equal(state.toast.key, 'toast_gift_already');
  assert.equal(qty(state, 'egg'), eggs - 1);
  endDay(state, 'sleep');
  assert.equal(talk(state, 'mei'), true);
  assert.equal(state.hearts.mei, 1);
}

// At 4 hearts, Aunt Hua's packet and Granny Tao's cake arrive once.
{
  const state = createState();
  state.hearts.hua = 3.5;
  const seeds = qty(state, 'seed_turnip');
  talk(state, 'hua');
  assert.equal(state.hearts.hua, 4);
  assert.equal(qty(state, 'seed_turnip'), seeds + 1);
  assert.equal(state.rewards.hua, true);
  talk(state, 'hua');
  assert.equal(qty(state, 'seed_turnip'), seeds + 1);

  state.hearts.tao = 4;
  state.talked = {};
  talk(state, 'tao');
  assert.equal(qty(state, 'pumpkin_cake'), 1);
  state.talked = {};
  talk(state, 'tao');
  assert.equal(qty(state, 'pumpkin_cake'), 1);
}

// Wilted plots clear in winter. Fresh soil stays frozen. Two dry days still wilt.
{
  const state = createState();
  state.season = 'winter';
  state.hotbar = 1;
  face(state, 24, 8, 'right');
  state.plots['25,8'].tilled = true;
  state.plots['25,8'].crop = 'pumpkin';
  state.plots['25,8'].wilted = true;
  assert.equal(till(state), true);
  assert.equal(state.plots['25,8'].wilted, false);
  assert.equal(state.plots['25,8'].crop, null);

  face(state, 25, 8, 'right');
  assert.equal(till(state), false);
  assert.equal(state.toast.key, 'toast_frozen');
  assert.equal(state.plots['26,8'].tilled, false);

  state.hotbar = 0;
  state.plots['24,8'].tilled = true;
  state.plots['24,8'].crop = 'pumpkin';
  state.plots['24,8'].wilted = true;
  face(state, 23, 8, 'right');
  assert.equal(useTool(state), true);
  assert.equal(state.plots['24,8'].wilted, false);

  const spring = createState();
  const plot = spring.plots['24,8'];
  plot.tilled = true;
  plot.crop = 'turnip';
  plot.stage = 0;
  plot.watered = false;
  endDay(spring, 'sleep');
  assert.equal(plot.wilted, false);
  assert.equal(plot.dry, 1);
  endDay(spring, 'sleep');
  assert.equal(plot.wilted, true);
}

// Late planting warns and still plants. Shop quantities and upgrade saves work.
{
  const state = createState();
  state.day = 28;
  face(state, 24, 8, 'right');
  state.plots['25,8'].tilled = true;
  assert.equal(plant(state, 'turnip'), true);
  assert.equal(state.plots['25,8'].crop, 'turnip');
  assert.equal(state.toast.key, 'toast_late_plant');

  const feed = qty(state, 'feed');
  state.money = 5000;
  assert.equal(buy(state, 'feed', 10), true);
  assert.equal(qty(state, 'feed'), feed + 10);
  assert.equal(buy(state, 'upgrade_coop', 1), true);
  assert.equal(state.upgrades.coop, true);
  const saved = JSON.parse(localStorage.getItem('farm-days-save-v1'));
  assert.equal(saved.v, 2);
  assert.equal(saved.upgrades.coop, true);

  const day = state.day;
  assert.equal(sleep(state), true);
  const after = JSON.parse(localStorage.getItem('farm-days-save-v1'));
  assert.equal(after.day, day === 28 ? 1 : day + 1);
  assert.equal(after.v, 2);
}

// Hold-to-repeat does not spend seeds. Inv/cal stay shut during help.
{
  const state = createState();
  face(state, 24, 8, 'right');
  state.plots['25,8'].tilled = true;
  state.hotbar = 3;
  const seeds = qty(state, 'seed_turnip');
  const energy = state.energy;
  update(state, { x: 0, y: 0, pressed: {}, holdUse: true, wheel: 0 }, 1000);
  assert.equal(qty(state, 'seed_turnip'), seeds);
  assert.equal(state.energy, energy);

  state.panel = 'help';
  state.seenHelp = false;
  update(state, { x: 0, y: 0, pressed: { inv: true }, holdUse: false, wheel: 0 }, 16);
  assert.equal(state.panel, 'help');
  update(state, { x: 0, y: 0, pressed: { cal: true }, holdUse: false, wheel: 0 }, 16);
  assert.equal(state.panel, 'help');
  update(state, { x: 0, y: 0, pressed: { close: true }, holdUse: false, wheel: 0 }, 16);
  assert.equal(state.panel, null);
  assert.equal(state.seenHelp, true);
}

for (const [key, row] of Object.entries(STR)) {
  assert.equal(typeof row.zh, 'string', key);
  assert.equal(typeof row.en, 'string', key);
  assert.ok(row.zh.length > 0, key);
  assert.ok(row.en.length > 0, key);
}

console.log('unit tests ok');
