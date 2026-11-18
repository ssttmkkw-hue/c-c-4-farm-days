import { CROP_LIST } from '../data/crops.js';
import { COCOA_PRICE, FEED_PRICE, SPRINKLER_PRICE, UPGRADES } from '../data/items.js';

export function shopOpen(state) {
  return state.time >= 6 * 60 && state.time < 20 * 60;
}

export function getStock(state) {
  const list = [];
  if (state.season !== 'winter') {
    for (const crop of CROP_LIST) {
      if (crop.season !== state.season) continue;
      list.push({ id: 'seed_' + crop.id, price: crop.seed, upgrade: false, owned: false });
    }
  }
  list.push({ id: 'feed', price: FEED_PRICE, upgrade: false, owned: false });
  const up = state.upgrades || {};
  if (!up.can) {
    list.push({ id: 'upgrade_can', price: UPGRADES.upgrade_can.price, upgrade: true, owned: false });
  }
  if (!up.backpack) {
    list.push({ id: 'upgrade_bag', price: UPGRADES.upgrade_bag.price, upgrade: true, owned: false });
  }
  if (!up.coop) {
    list.push({ id: 'upgrade_coop', price: UPGRADES.upgrade_coop.price, upgrade: true, owned: false });
  }
  if (!up.hearth) {
    list.push({ id: 'upgrade_hearth', price: UPGRADES.upgrade_hearth.price, upgrade: true, owned: false });
  }
  list.push({ id: 'sprinkler', price: SPRINKLER_PRICE, upgrade: false, owned: false });
  if (state.season === 'winter') {
    list.push({ id: 'cocoa', price: COCOA_PRICE, upgrade: false, owned: false });
  }
  return list;
}
