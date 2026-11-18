/** Short seasons, short growth. No quality grades. */
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export const CROPS = {
  turnip: {
    id: 'turnip',
    season: 'spring',
    days: 2,
    seed: 20,
    sell: 70,
    regrow: 0,
    leaf: '#6eaf45',
    fruit: '#f4f0e2',
  },
  cabbage: {
    id: 'cabbage',
    season: 'spring',
    days: 4,
    seed: 40,
    sell: 140,
    regrow: 0,
    leaf: '#7dce63',
    fruit: '#b7e38a',
  },
  tomato: {
    id: 'tomato',
    season: 'summer',
    days: 4,
    seed: 50,
    sell: 80,
    regrow: 2,
    leaf: '#3f8a32',
    fruit: '#e04b3a',
  },
  corn: {
    id: 'corn',
    season: 'summer',
    days: 5,
    seed: 70,
    sell: 190,
    regrow: 0,
    leaf: '#6aaa3a',
    fruit: '#f0d24a',
  },
  pumpkin: {
    id: 'pumpkin',
    season: 'autumn',
    days: 5,
    seed: 90,
    sell: 230,
    regrow: 0,
    leaf: '#d4652f',
    fruit: '#e67a22',
  },
  sweetpotato: {
    id: 'sweetpotato',
    season: 'autumn',
    days: 3,
    seed: 40,
    sell: 120,
    regrow: 0,
    leaf: '#c46b4a',
    fruit: '#d4895c',
  },
};

export const CROP_LIST = Object.values(CROPS);

export function cropById(id) {
  return CROPS[id] || null;
}
