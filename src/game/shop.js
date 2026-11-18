import { CROP_LIST } from '../data/crops.js';
import { FEED_PRICE, SPRINKLER_PRICE, UPGRADES } from '../data/items.js';

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
  if (!state.upgrades.can) {
    list.push({ id: 'upgrade_can', price: UPGRADES.upgrade_can.price, upgrade: true, owned: false });
  }
  if (!state.upgrades.backpack) {
    list.push({ id: 'upgrade_bag', price: UPGRADES.upgrade_bag.price, upgrade: true, owned: false });
  }
  list.push({ id: 'sprinkler', price: SPRINKLER_PRICE, upgrade: false, owned: false });
  return list;
}
