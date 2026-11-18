import { CROPS } from './crops.js';

/** Sell prices for goods that are not crops. */
export const GOODS = {
  egg: { sell: 35 },
  milk: { sell: 90 },
  forage_herb: { sell: 30 },
  forage_berry: { sell: 35 },
  forage_mushroom: { sell: 40 },
  forage_cone: { sell: 25 },
  cocoa: { sell: 18 },
  pumpkin_cake: { sell: 40 },
};

export const TOOLS = new Set(['hand', 'hoe', 'can']);

export const UPGRADES = {
  upgrade_can: { price: 420 },
  upgrade_bag: { price: 360 },
  upgrade_coop: { price: 1400 },
  upgrade_hearth: { price: 900 },
};

export const COCOA_PRICE = 30;

export const SPRINKLER_PRICE = 680;
export const FEED_PRICE = 10;
export const SPRINKLER_CAP = 8;

export function sellPrice(id) {
  if (CROPS[id]) return CROPS[id].sell;
  if (GOODS[id]) return GOODS[id].sell;
  return 0;
}

export function isTool(id) {
  return TOOLS.has(id);
}

export function isSeed(id) {
  return typeof id === 'string' && id.startsWith('seed_');
}

export function seedCropId(id) {
  return isSeed(id) ? id.slice(5) : null;
}

export function forageForSeason(season) {
  if (season === 'spring') return 'forage_herb';
  if (season === 'summer') return 'forage_berry';
  if (season === 'autumn') return 'forage_mushroom';
  return 'forage_cone';
}

export function stackMax(id) {
  if (isTool(id)) return 1;
  if (id === 'sprinkler') return 8;
  return 99;
}

/** Gifts are things a neighbor can actually hold: crops, animal goods, forage. */
export function isGiftable(id) {
  return sellPrice(id) > 0;
}
