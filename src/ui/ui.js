import { CROP_LIST } from '../data/crops.js';
import { isGiftable } from '../data/items.js';
import { itemName, t } from '../data/strings.js';
import { npcDef } from '../data/dialogues.js';
import {
  buy,
  chestMove,
  closePanel,
  give,
  shipSlot,
  sleep,
  unship,
} from '../game/actions.js';
import { formatClock, lastSafePlantDay, phaseOf, weekdayIndex } from '../game/calendar.js';
import { held, selectSlot, shippingValue } from '../game/inventory.js';
import { getStock } from '../game/shop.js';
import { saveGame, writeSettings } from '../game/save.js';
import { showToast } from '../game/state.js';
import { iconURL } from '../sprites/sprites.js';

function esc(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function toastText(state) {
  if (!state?.toast) return '';
  const lang = state.lang === 'en' ? 'en' : 'zh';
  const vars = { ...(state.toast.vars || {}) };
  if (vars.name) {
    const animal = (state.animals || []).find((a) => a.id === vars.name);
    if (animal) vars.name = lang === 'en' ? animal.en : animal.zh;
    else if (vars.name === 'spring' || vars.name === 'summer' || vars.name === 'autumn' || vars.name === 'winter') {
      vars.name = t(lang, 'season_' + vars.name + '_long');
    } else vars.name = itemName(lang, vars.name);
  }
  return t(lang, state.toast.key, vars);
}

export function createUi(ctx) {
  const panel = document.getElementById('panel');
  const hotbar = document.getElementById('hotbar');
  const toast = document.getElementById('toast');
  const title = document.getElementById('title');
  let sig = '';

  function lang() {
    return ctx.state?.lang === 'en' ? 'en' : (ctx.settings.lang === 'en' ? 'en' : 'zh');
  }

  function setLang(next) {
    if (next !== 'zh' && next !== 'en') return;
    ctx.settings.lang = next;
    if (ctx.state) ctx.state.lang = next;
    writeSettings({ lang: next, muted: !!(ctx.state?.muted ?? ctx.settings.muted), touch: ctx.state?.touch || ctx.settings.touch || 'auto' });
    ctx.refresh();
  }

  function touchOn() {
    const mode = ctx.state?.touch || ctx.settings.touch || 'auto';
    if (mode === 'on') return true;
    if (mode === 'off') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820 || window.innerHeight < 520;
  }

  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const state = ctx.state;
    if (!state?.started) return;
    const act = b.dataset.act;
    ctx.audio?.unlock();
    if (act === 'close') closePanel(state);
    else if (act === 'closehelp') {
      state.seenHelp = true;
      state.panel = null;
    } else if (act === 'sleep') sleep(state);
    else if (act === 'slot') selectSlot(state, Number(b.dataset.slot));
    else if (act === 'ship') shipSlot(state, Number(b.dataset.slot));
    else if (act === 'to-chest') chestMove(state, 'bag', Number(b.dataset.slot));
    else if (act === 'to-bag') chestMove(state, 'chest', Number(b.dataset.slot));
    else if (act === 'unship') unship(state, Number(b.dataset.index));
    else if (act === 'buy') buy(state, b.dataset.id, Number(b.dataset.qty) || 1);
    else if (act === 'give') {
      const item = held(state);
      if (state.dialogue && item) give(state, state.dialogue.npcId, item.id);
    } else if (act === 'lang') setLang(b.dataset.lang);
    else if (act === 'mute') {
      state.muted = !state.muted;
      ctx.settings.muted = state.muted;
      ctx.audio?.setMuted(state.muted);
      writeSettings(state);
    } else if (act === 'touch') {
      state.touch = b.dataset.mode;
      ctx.settings.touch = state.touch;
      writeSettings(state);
    } else if (act === 'openhelp') state.panel = 'help';
    else if (act === 'save') {
      if (saveGame(state)) showToast(state, 'saved');
    } else if (act === 'title') {
      saveGame(state);
      state.screen = 'title';
      state.panel = null;
      state.paused = true;
      state.dialogue = null;
    }
    ctx.refresh();
  });

  hotbar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-slot]');
    if (!b || !ctx.state?.started) return;
    ctx.audio?.unlock();
    selectSlot(ctx.state, Number(b.dataset.slot));
    ctx.refresh();
  });

  document.getElementById('btn-lang').addEventListener('click', () => {
    ctx.audio?.unlock();
    setLang(lang() === 'zh' ? 'en' : 'zh');
  });
  document.getElementById('btn-mute').addEventListener('click', () => {
    ctx.audio?.unlock();
    const state = ctx.state;
    const muted = !(state?.muted ?? ctx.settings.muted);
    ctx.settings.muted = muted;
    if (state) state.muted = muted;
    ctx.audio?.setMuted(muted);
    writeSettings({ lang: lang(), muted, touch: state?.touch || ctx.settings.touch || 'auto' });
    ctx.refresh();
  });
  document.getElementById('btn-menu').addEventListener('click', () => {
    if (!ctx.state?.started || ctx.state.screen !== 'play') return;
    ctx.audio?.unlock();
    if (ctx.state.panel) closePanel(ctx.state);
    else {
      ctx.state.panel = 'settings';
      ctx.state.paused = true;
    }
    ctx.refresh();
  });

  const sleepBtn = document.querySelector('[data-btn="sleep"]');
  if (sleepBtn) {
    sleepBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const state = ctx.state;
      if (!state?.started || state.screen !== 'play') return;
      ctx.audio?.unlock();
      if (state.location === 'house') state.panel = 'sleep';
      else showToast(state, 'bed_only');
      ctx.refresh();
    });
  }

  document.getElementById('btn-new').addEventListener('click', () => {
    ctx.audio?.unlock();
    if (ctx.hasContinue()) {
      document.getElementById('title-confirm').hidden = false;
      return;
    }
    ctx.onNew();
  });
  document.getElementById('btn-new-yes').addEventListener('click', () => {
    ctx.audio?.unlock();
    document.getElementById('title-confirm').hidden = true;
    ctx.onNew();
  });
  document.getElementById('btn-new-no').addEventListener('click', () => {
    document.getElementById('title-confirm').hidden = true;
  });
  document.getElementById('btn-continue').addEventListener('click', () => {
    document.getElementById('title-confirm').hidden = true;
    ctx.onContinue();
  });

  function syncHud(state) {
    const L = lang();
    const playing = state?.started && state.screen === 'play';
    document.getElementById('hud').hidden = !playing;
    hotbar.hidden = !playing;
    document.getElementById('btn-lang').textContent = L === 'zh' ? 'EN' : '中';
    const muted = !!(state?.muted ?? ctx.settings.muted);
    document.getElementById('btn-mute').textContent = muted ? '×' : '♪';
    document.getElementById('btn-mute').setAttribute('aria-label', t(L, muted ? 'mute_off' : 'mute_on'));
    const touch = document.getElementById('touch');
    const showTouch = touchOn() && playing;
    touch.hidden = !showTouch;
    document.body.classList.toggle('touch-on', showTouch);
    const label = (btn, key) => {
      const el = touch.querySelector('[data-btn="' + btn + '"]');
      if (!el) return;
      const text = t(L, key);
      if (btn === 'inv' || btn === 'cal' || btn === 'sleep' || btn === 'menu') el.textContent = text;
      el.setAttribute('aria-label', text);
    };
    label('use', 'btn_use');
    label('interact', 'btn_talk');
    label('inv', 'btn_bag');
    label('cal', 'btn_cal');
    label('sleep', 'btn_sleep');
    label('menu', 'btn_menu');
    if (!playing) {
      toast.hidden = true;
      return;
    }
    const narrow = window.innerWidth < 820 || window.innerHeight < 520;
    const season = narrow ? t(L, 'season_' + state.season) : t(L, 'season_' + state.season + '_long');
    const date = narrow
      ? season + state.day
      : season + ' · ' + t(L, 'day_label', { day: state.day }) + ' ' + t(L, 'wd_' + weekdayIndex(state.day));
    document.getElementById('hud-date').textContent = date;
    document.getElementById('hud-time').textContent = narrow
      ? formatClock(state.time)
      : formatClock(state.time) + ' ' + t(L, 'phase_' + phaseOf(state.time));
    document.getElementById('hud-gold').textContent = state.money + (narrow ? '' : ' ') + t(L, 'gold');
    document.getElementById('hud-loc').textContent = t(L, 'loc_' + state.location);
    const pct = Math.max(0, Math.min(100, (state.energy / (state.energyMax || 1)) * 100));
    const fill = document.getElementById('energy-fill');
    fill.style.width = pct + '%';
    fill.style.background = pct < 25 ? '#c4503a' : pct < 50 ? '#e6c15a' : '#5e9a3c';
    document.getElementById('energy-label').textContent = narrow
      ? String(Math.ceil(state.energy))
      : t(L, 'energy') + ' ' + Math.ceil(state.energy);
    const item = held(state);
    document.getElementById('hud-held').textContent = item ? itemName(L, item.id) : '';
    document.getElementById('hud-can').textContent = t(L, 'can_water', { n: state.canWater, max: state.canMax });
    const msg = state.toastT > 0 ? toastText(state) : '';
    toast.hidden = !msg;
    toast.textContent = msg;
  }

  function syncTitle(state) {
    const L = lang();
    const onTitle = !state?.started || state.screen !== 'play';
    title.hidden = !onTitle;
    document.getElementById('title-name').textContent = t(L, 'title');
    document.getElementById('title-sub').textContent = t(L, 'subtitle');
    document.getElementById('btn-new').textContent = t(L, 'new_game');
    document.getElementById('btn-continue').textContent = t(L, 'continue');
    document.getElementById('btn-continue').disabled = !ctx.hasContinue();
    document.getElementById('title-lang').textContent = L === 'zh' ? 'English' : '中文';
    document.getElementById('title-hint').textContent = L === 'zh'
      ? 'WASD 移动 · J 工具 · E 互动 · 1–8 工具栏'
      : 'WASD move · J tool · E interact · 1–8 hotbar';
    document.getElementById('title-confirm-text').textContent = t(L, 'new_confirm');
    document.getElementById('btn-new-yes').textContent = t(L, 'new_yes');
    document.getElementById('btn-new-no').textContent = t(L, 'new_no');
  }

  document.getElementById('title-lang').addEventListener('click', () => setLang(lang() === 'zh' ? 'en' : 'zh'));

  function renderHotbar(state) {
    const L = lang();
    const slots = [];
    for (let i = 0; i < 8; i++) {
      const item = state.inventory[i];
      const sel = i === state.hotbar ? ' selected' : '';
      const icon = item ? '<img alt="" src="' + iconURL(item.id) + '">' : '';
      const qty = item && item.qty > 1 ? '<em>' + item.qty + '</em>' : '';
      const label = item ? esc(itemName(L, item.id)) : '';
      slots.push('<button type="button" class="slot' + sel + '" data-slot="' + i + '" aria-label="' + esc(label || (i + 1)) + '"><span>' + (i + 1) + '</span>' + icon + qty + '</button>');
    }
    hotbar.innerHTML = slots.join('');
  }

  function itemButton(L, item, act, extra) {
    if (!item) return '';
    return '<button type="button" class="item-row" data-act="' + act + '" ' + extra + '>'
      + '<img alt="" src="' + iconURL(item.id) + '">'
      + '<span>' + esc(itemName(L, item.id)) + (item.qty > 1 ? ' ×' + item.qty : '') + '</span></button>';
  }

  function renderPanel(state) {
    const L = lang();
    if (!state.panel) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }
    panel.hidden = false;
    let html = '';
    if (state.panel === 'help') {
      html = card(t(L, 'help_title'), [
        '<p>' + esc(t(L, 'help_1')) + '</p>',
        '<p>' + esc(t(L, 'help_2')) + '</p>',
        '<p>' + esc(t(L, 'help_3')) + '</p>',
        '<p>' + esc(t(L, 'help_4')) + '</p>',
        '<p>' + esc(t(L, 'help_5')) + '</p>',
        '<p>' + esc(t(L, 'help_6')) + '</p>',
        '<button type="button" data-act="closehelp">' + esc(t(L, 'help_ok')) + '</button>',
      ]);
    } else if (state.panel === 'sleep') {
      html = card(t(L, 'sleep_title'), [
        '<p>' + esc(t(L, 'sleep_body')) + '</p>',
        '<div class="row-btns"><button type="button" data-act="sleep">' + esc(t(L, 'sleep_yes')) + '</button>',
        '<button type="button" data-act="close">' + esc(t(L, 'sleep_no')) + '</button></div>',
      ]);
    } else if (state.panel === 'passout') {
      html = card(t(L, 'passout_title'), [
        '<p>' + esc(t(L, 'passout_body', { gold: state.passPenalty || 0 })) + '</p>',
        '<button type="button" data-act="close">' + esc(t(L, 'passout_ok')) + '</button>',
      ]);
    } else if (state.panel === 'notice') {
      html = card(t(L, 'notice_board'), [
        '<p>' + esc(t(L, state.noticeKey || 'board_spring')) + '</p>',
        '<button type="button" data-act="close">' + esc(t(L, 'close')) + '</button>',
      ]);
    } else if (state.panel === 'dialogue') {
      const d = state.dialogue;
      const npc = state.npcs.find((n) => n.id === d.npcId);
      const def = npcDef(d.npcId);
      const name = npc ? (L === 'en' ? npc.en : npc.zh) : '';
      const page = d.pages[d.page] || { zh: '', en: '' };
      const heart = heartString(state.hearts[d.npcId] || 0);
      const item = held(state);
      const giveBtn = item && isGiftable(item.id)
        ? '<button type="button" data-act="give">' + esc(t(L, 'give_btn', { name: itemName(L, item.id) })) + '</button>'
        : '';
      const talkKey = touchOn() ? 'B' : 'E';
      html = card(name + '  ' + heart, [
        '<p class="talk">' + esc(page[L] || page.zh) + '</p>',
        '<p class="hint">' + esc(t(L, 'talk_hint', { key: talkKey })) + '</p>',
        '<div class="row-btns">' + giveBtn + '<button type="button" data-act="close">' + esc(t(L, 'close')) + '</button></div>',
      ], def ? '' : '');
    } else if (state.panel === 'inventory') {
      html = card(t(L, 'inv_title'), [
        '<p class="hint">' + esc(t(L, 'inv_hint')) + '</p>',
        grid(state, L, 'slot'),
        '<button type="button" data-act="close">' + esc(t(L, 'close')) + '</button>',
      ]);
    } else if (state.panel === 'chest') {
      const chest = Array.isArray(state.chest) ? state.chest : [];
      html = card(t(L, 'chest_title'), [
        '<p class="hint">' + esc(t(L, 'chest_hint')) + '</p>',
        '<div class="split"><div><h3>' + esc(t(L, 'inv_title')) + '</h3>' + grid(state, L, 'to-chest') + '</div>',
        '<div><h3>' + esc(t(L, 'chest_title')) + '</h3>' + slotGrid(chest, L, 'to-bag') + '</div></div>',
        '<button type="button" data-act="close">' + esc(t(L, 'close')) + '</button>',
      ]);
    } else if (state.panel === 'shipping') {
      const rows = state.shipping.map((s, i) => itemButton(L, s, 'unship', 'data-index="' + i + '"')).join('') || '<p>' + esc(t(L, 'ship_empty')) + '</p>';
      html = card(t(L, 'ship_title'), [
        '<p>' + esc(t(L, 'ship_hint')) + '</p>',
        '<p><strong>' + esc(t(L, 'ship_value', { gold: shippingValue(state) })) + '</strong></p>',
        '<div class="split"><div><h3>' + esc(t(L, 'inv_title')) + '</h3>' + grid(state, L, 'ship') + '</div>',
        '<div><h3>' + esc(t(L, 'ship_title')) + '</h3>' + rows + '</div></div>',
        '<button type="button" data-act="close">' + esc(t(L, 'close')) + '</button>',
      ]);
    } else if (state.panel === 'shop') {
      const stock = getStock(state);
      const rows = stock.map((offer) => {
        const descKey = offer.id === 'upgrade_can' ? 'upgrade_can_desc'
          : offer.id === 'upgrade_bag' ? 'upgrade_bag_desc'
            : offer.id === 'upgrade_coop' ? 'upgrade_coop_desc'
              : offer.id === 'upgrade_hearth' ? 'upgrade_hearth_desc'
                : offer.id === 'sprinkler' ? 'sprinkler_desc'
                  : offer.id === 'cocoa' ? 'cocoa_desc' : '';
        const icon = offer.id === 'upgrade_can' ? 'can'
          : offer.id === 'upgrade_bag' ? 'feed'
            : offer.id === 'upgrade_coop' ? 'egg'
              : offer.id === 'upgrade_hearth' ? 'forage_herb' : offer.id;
        return '<div class="shop-row"><img alt="" src="' + iconURL(icon) + '">'
          + '<div><strong>' + esc(itemName(L, offer.id)) + '</strong>'
          + (descKey ? '<small>' + esc(t(L, descKey)) + '</small>' : '')
          + '<small>' + esc(t(L, 'price', { gold: offer.price })) + '</small>'
          + '</div>' + qtyButtons(offer, state.money) + '</div>';
      }).join('');
      html = card(t(L, 'shop_title'), [
        '<p>' + esc(t(L, 'season_' + state.season + '_long')) + ' · ' + state.money + ' ' + esc(t(L, 'gold')) + '</p>',
        rows || '<p>' + esc(t(L, 'cal_none')) + '</p>',
        '<button type="button" data-act="close">' + esc(t(L, 'close')) + '</button>',
      ]);
    } else if (state.panel === 'calendar') {
      const crops = CROP_LIST.filter((c) => c.season === state.season);
      const lastDays = new Set(crops.map((c) => lastSafePlantDay(c.days)));
      const cells = [];
      for (let d = 1; d <= 28; d++) {
        const cls = ['day', d === state.day ? 'today' : '', lastDays.has(d) ? 'lastday' : ''].filter(Boolean).join(' ');
        cells.push('<span class="' + cls + '">' + d + '</span>');
      }
      const cropLine = crops.length
        ? crops.map((c) => esc(itemName(L, c.id)) + ' · ' + c.days + ' · ' + esc(t(L, 'cal_last', { day: lastSafePlantDay(c.days) }))).join('<br>')
        : esc(t(L, 'cal_none'));
      html = card(t(L, 'cal_title'), [
        '<p>' + esc(t(L, 'year_label', { year: state.year })) + ' · ' + esc(t(L, 'season_' + state.season + '_long')) + '</p>',
        '<div class="cal">' + cells.join('') + '</div>',
        crops.length ? '<p class="hint">' + esc(t(L, 'cal_mark')) + '</p>' : '',
        '<h3>' + esc(t(L, 'cal_crops')) + '</h3>',
        '<p>' + cropLine + '</p>',
        '<button type="button" data-act="close">' + esc(t(L, 'close')) + '</button>',
      ]);
    } else if (state.panel === 'settings') {
      const mode = state.touch || 'auto';
      html = card(t(L, 'settings'), [
        '<div class="row-btns">',
        '<button type="button" data-act="lang" data-lang="zh"' + (L === 'zh' ? ' class="on"' : '') + '>' + esc(t(L, 'lang_zh')) + '</button>',
        '<button type="button" data-act="lang" data-lang="en"' + (L === 'en' ? ' class="on"' : '') + '>' + esc(t(L, 'lang_en')) + '</button>',
        '</div>',
        '<button type="button" data-act="mute">' + esc(t(L, state.muted ? 'mute_off' : 'mute_on')) + '</button>',
        '<p>' + esc(t(L, 'touch')) + '</p>',
        '<div class="row-btns">',
        modeBtn(L, 'auto', mode), modeBtn(L, 'on', mode), modeBtn(L, 'off', mode),
        '</div>',
        '<div class="row-btns">',
        '<button type="button" data-act="openhelp">' + esc(t(L, 'help')) + '</button>',
        '<button type="button" data-act="save">' + esc(t(L, 'save_now')) + '</button>',
        '<button type="button" data-act="title">' + esc(t(L, 'back_title')) + '</button>',
        '</div>',
        '<button type="button" data-act="close">' + esc(t(L, 'close')) + '</button>',
      ]);
    }
    panel.innerHTML = html;
  }

  function heartString(n) {
    const x = Math.max(0, Math.min(5, Number(n) || 0));
    const full = Math.floor(x + 1e-6);
    const half = full < 5 && x + 1e-6 >= full + 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return '♥'.repeat(full) + (half ? '½' : '') + '♡'.repeat(Math.max(0, empty));
  }

  function qtyButtons(offer, money) {
    const steps = offer.upgrade ? [1] : [1, 5, 10];
    return '<div class="qty">' + steps.map((q) => {
      const afford = money >= offer.price * q;
      const label = offer.upgrade ? t(lang(), 'buy') : '×' + q;
      return '<button type="button" data-act="buy" data-id="' + esc(offer.id) + '" data-qty="' + q + '"'
        + (afford ? '' : ' disabled') + '>' + esc(label) + '</button>';
    }).join('') + '</div>';
  }

  function modeBtn(L, mode, current) {
    const key = mode === 'auto' ? 'touch_auto' : mode === 'on' ? 'touch_on' : 'touch_off';
    return '<button type="button" data-act="touch" data-mode="' + mode + '"' + (current === mode ? ' class="on"' : '') + '>' + esc(t(L, key)) + '</button>';
  }

  function grid(state, L, act) {
    return slotGrid(state.inventory, L, act, state.hotbar);
  }

  function slotGrid(slots, L, act, hotbar) {
    const bits = [];
    for (let i = 0; i < slots.length; i++) {
      const item = slots[i];
      if (!item) {
        bits.push('<span class="slot ghost"></span>');
        continue;
      }
      const mark = item.bonus ? ' +' + item.bonus : '';
      bits.push('<button type="button" class="slot' + (i === hotbar ? ' selected' : '') + '" data-act="' + act + '" data-slot="' + i + '">'
        + '<img alt="" src="' + iconURL(item.id) + '">'
        + (item.qty > 1 ? '<em>' + item.qty + '</em>' : '')
        + '<small>' + esc(itemName(L, item.id) + mark) + '</small></button>');
    }
    return '<div class="grid">' + bits.join('') + '</div>';
  }

  function card(titleText, parts) {
    return '<div class="card" role="dialog"><h2>' + esc(titleText) + '</h2>' + parts.join('') + '</div>';
  }

  function signature(state) {
    if (!state?.started || state.screen !== 'play') return 'off';
    return JSON.stringify({
      p: state.panel,
      d: state.dialogue,
      n: state.noticeKey,
      lang: state.lang,
      inv: state.inventory,
      chest: state.chest,
      hot: state.hotbar,
      ship: state.shipping,
      money: state.money,
      hearts: state.hearts,
      season: state.season,
      day: state.day,
      year: state.year,
      up: state.upgrades,
      pen: state.passPenalty,
      touch: state.touch,
      muted: state.muted,
    });
  }

  return {
    sync() {
      const state = ctx.state;
      syncHud(state);
      syncTitle(state);
      const next = signature(state);
      if (next !== sig) {
        sig = next;
        if (state?.started && state.screen === 'play') {
          renderHotbar(state);
          renderPanel(state);
        } else {
          panel.hidden = true;
          panel.innerHTML = '';
          hotbar.innerHTML = '';
        }
      }
      document.documentElement.lang = lang() === 'en' ? 'en' : 'zh';
    },
    touchOn,
    setLang,
  };
}
