import {
  aimTile,
  buy,
  chestMove as moveChestStack,
  collectShipping,
  doPassout,
  equip,
  feed,
  give,
  go,
  harvest,
  interact,
  milk,
  plant,
  sleep,
  talk,
  teleport,
  till,
  useTool,
  water,
} from './actions.js';
import { DAY_END, DAY_START } from './calendar.js';
import { saveGame, loadGame, writeSettings } from './save.js';
import { snapshot } from './snapshot.js';
import { createState } from './state.js';

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function createApi(ctx) {
  function ready() {
    return !!(ctx.state && ctx.state.started);
  }

  function playable() {
    return ready() && ctx.state.screen === 'play';
  }

  function after(ok) {
    if (ctx.refresh) ctx.refresh();
    return ok;
  }

  return {
    getState() {
      try {
        if (!ready()) return snapshot({ lang: ctx.settings?.lang || 'zh', started: false });
        return snapshot(ctx.state);
      } catch (err) {
        console.error(err);
        return snapshot(null);
      }
    },
    newGame() {
      try {
        const lang = ctx.state?.lang || ctx.settings?.lang || 'zh';
        const muted = !!(ctx.state?.muted ?? ctx.settings?.muted);
        const touch = ctx.state?.touch || ctx.settings?.touch || 'auto';
        ctx.state = createState(lang, muted);
        ctx.state.touch = touch;
        ctx.state.panel = null;
        ctx.state.seenHelp = true;
        ctx.state.screen = 'play';
        saveGame(ctx.state);
        return after(true);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    save() {
      try {
        if (!ready()) return false;
        return saveGame(ctx.state);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    load() {
      try {
        const data = loadGame();
        if (!data) return false;
        data.lang = data.lang === 'en' ? 'en' : (ctx.settings?.lang || 'zh');
        ctx.state = data;
        ctx.state.screen = 'play';
        ctx.state.paused = false;
        return after(true);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    setLang(lang) {
      try {
        if (lang !== 'zh' && lang !== 'en') return false;
        if (ctx.settings) ctx.settings.lang = lang;
        if (ctx.state) ctx.state.lang = lang;
        writeSettings({
          lang,
          muted: !!(ctx.state?.muted ?? ctx.settings?.muted),
          touch: ctx.state?.touch || ctx.settings?.touch || 'auto',
        });
        return after(true);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    teleport(x, y) {
      try {
        if (!playable()) return false;
        return after(teleport(ctx.state, num(x), num(y)));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    go(location) {
      try {
        if (!playable()) return false;
        return after(go(ctx.state, location));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    setTime(timeOfDay) {
      try {
        if (!playable()) return false;
        const state = ctx.state;
        if (typeof timeOfDay === 'string') {
          const named = { morning: 8 * 60, noon: 12 * 60, evening: 17 * 60, night: 21 * 60 };
          if (named[timeOfDay] != null) state.time = named[timeOfDay];
          else if (/^\d{1,2}:\d{2}$/.test(timeOfDay)) {
            const [h, m] = timeOfDay.split(':').map(Number);
            state.time = h * 60 + m;
          } else return false;
        } else {
          const n = num(timeOfDay);
          if (n == null) return false;
          state.time = n <= 24 ? n * 60 : n;
        }
        state.time = Math.max(0, Math.min(DAY_END - 1, state.time));
        return after(true);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    advanceTime(minutes) {
      try {
        if (!playable()) return false;
        const n = num(minutes);
        if (n == null) return false;
        ctx.state.time += n;
        if (ctx.state.time >= DAY_END) doPassout(ctx.state);
        return after(true);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    setEnergy(n) {
      try {
        if (!playable()) return false;
        const v = num(n);
        if (v == null) return false;
        ctx.state.energy = Math.max(0, Math.min(ctx.state.energyMax, v));
        return after(true);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    setMoney(n) {
      try {
        if (!playable()) return false;
        const v = num(n);
        if (v == null) return false;
        ctx.state.money = Math.max(0, Math.floor(v));
        return after(true);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    equip(id) {
      try {
        if (!playable()) return false;
        return after(equip(ctx.state, id));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    useTool() {
      try {
        if (!playable()) return false;
        return after(useTool(ctx.state));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    interact() {
      try {
        if (!playable()) return false;
        return after(interact(ctx.state));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    sleep() {
      try {
        if (!playable()) return false;
        const ok = sleep(ctx.state);
        saveGame(ctx.state);
        return after(ok);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    collectShipping() {
      try {
        if (!playable()) return false;
        return after(collectShipping(ctx.state));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    plant(cropId) {
      try {
        if (!playable()) return false;
        return after(plant(ctx.state, cropId));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    water() {
      try {
        if (!playable()) return false;
        return after(water(ctx.state));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    harvest() {
      try {
        if (!playable()) return false;
        return after(harvest(ctx.state));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    till() {
      try {
        if (!playable()) return false;
        return after(till(ctx.state));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    give(npcId, itemId) {
      try {
        if (!playable()) return false;
        return after(give(ctx.state, npcId, itemId));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    talk(npcId) {
      try {
        if (!playable()) return false;
        return after(talk(ctx.state, npcId));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    feed(animalId) {
      try {
        if (!playable()) return false;
        return after(feed(ctx.state, animalId));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    milk(animalId) {
      try {
        if (!playable()) return false;
        return after(milk(ctx.state, animalId));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    buy(itemId, qty) {
      try {
        if (!playable()) return false;
        return after(buy(ctx.state, itemId, qty));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    chestMove(from, index) {
      try {
        if (!playable()) return false;
        return after(moveChestStack(ctx.state, from, index));
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    tick(ms) {
      try {
        if (!playable() || !ctx.update) return false;
        ctx.update(ctx.state, null, num(ms) == null ? 16 : num(ms));
        if (ctx.draw) ctx.draw();
        return after(true);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    aim() {
      try {
        if (!playable()) return null;
        return aimTile(ctx.state);
      } catch (err) {
        console.error(err);
        return null;
      }
    },
  };
}

export { DAY_START };
