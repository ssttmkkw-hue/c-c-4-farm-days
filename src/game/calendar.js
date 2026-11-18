import { SEASONS } from '../data/crops.js';
import { mulberry32 } from './rng.js';

export const DAY_START = 6 * 60;
export const DAY_END = 24 * 60;
export const DAYS_PER_SEASON = 28;

export function phaseOf(time) {
  const h = time / 60;
  if (h < 10) return 'morning';
  if (h < 16) return 'noon';
  if (h < 19) return 'evening';
  return 'night';
}

export function formatClock(time) {
  const t = Math.max(0, Math.floor(time));
  const h = Math.floor(t / 60) % 24;
  const m = t % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function weekdayIndex(day) {
  return (day - 1) % 7;
}

export function nextDate(year, season, day) {
  let d = day + 1;
  let s = season;
  let y = year;
  let changed = false;
  if (d > DAYS_PER_SEASON) {
    d = 1;
    const i = SEASONS.indexOf(s);
    if (i >= 3) {
      s = 'spring';
      y += 1;
    } else {
      s = SEASONS[i + 1];
    }
    changed = true;
  }
  return { year: y, season: s, day: d, changed };
}

/** First three spring days of year 1 stay sunny so the first week is readable. */
export function rollWeather(year, season, day) {
  if (year === 1 && season === 'spring' && day <= 3) return 'sunny';
  const idx = Math.max(0, SEASONS.indexOf(season));
  const rand = mulberry32(year * 1000 + idx * 100 + day);
  const r = rand();
  if (season === 'winter') {
    if (r < 0.4) return 'snow';
    if (r < 0.7) return 'cloudy';
    return 'sunny';
  }
  const rain = season === 'summer' ? 0.14 : season === 'spring' ? 0.26 : 0.22;
  if (r < rain) return 'rain';
  if (r < rain + 0.22) return 'cloudy';
  return 'sunny';
}
