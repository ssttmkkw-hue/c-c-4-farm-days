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
    copy.v = 1;
    ls.setItem(SAVE_KEY, JSON.stringify(copy));
    writeSettings(copy);
    return true;
  } catch {
    return false;
  }
}

export function loadGame() {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !data.plots || !data.player) return null;
    data.panel = null;
    data.dialogue = null;
    data.paused = false;
    data.screen = 'play';
    data.started = true;
    data.toast = null;
    data.toastT = 0;
    data.linkLock = false;
    if (!data.upgrades) data.upgrades = { can: false, backpack: false };
    if (!data.hearts) data.hearts = { hua: 0, mei: 0, lin: 0, wei: 0, tao: 0 };
    if (!Array.isArray(data.inventory)) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearSave() {
  const ls = storage();
  if (!ls) return;
  try { ls.removeItem(SAVE_KEY); } catch { /* ignore */ }
}
