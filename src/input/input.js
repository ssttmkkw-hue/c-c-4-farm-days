import { cameraFor } from '../render/render.js';

const MOVE = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function createInput(canvas, getState) {
  const down = new Set();
  const touch = { up: 0, down: 0, left: 0, right: 0 };
  const pressed = { use: false, interact: false, close: false, inv: false, cal: false, give: false, slots: Array(8).fill(false) };
  let holdUse = false;
  let wheel = 0;

  function press(name) {
    pressed[name] = true;
  }

  function playing() {
    const state = getState();
    return !!(state && state.started && state.screen === 'play');
  }

  function onKeyDown(e) {
    if (!playing()) return;
    if (e.repeat && MOVE[e.code]) {
      down.add(MOVE[e.code]);
      e.preventDefault();
      return;
    }
    if (MOVE[e.code]) {
      down.add(MOVE[e.code]);
      e.preventDefault();
      return;
    }
    if (e.repeat) return;
    if (e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'KeyK') {
      press('use');
      holdUse = true;
      e.preventDefault();
    } else if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      press('interact');
      e.preventDefault();
    } else if (e.code === 'Escape') {
      press('close');
      e.preventDefault();
    } else if (e.code === 'KeyI' || e.code === 'Tab') {
      press('inv');
      e.preventDefault();
    } else if (e.code === 'KeyM' || e.code === 'KeyC') {
      press('cal');
      e.preventDefault();
    } else if (e.code === 'KeyG') {
      press('give');
      e.preventDefault();
    } else if (/^Digit[1-8]$/.test(e.code) || /^Numpad[1-8]$/.test(e.code)) {
      const n = Number(e.code.slice(-1)) - 1;
      pressed.slots[n] = true;
      e.preventDefault();
    }
  }

  function onKeyUp(e) {
    if (MOVE[e.code]) down.delete(MOVE[e.code]);
    if (e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'KeyK') holdUse = false;
  }

  function tileFromEvent(e) {
    const state = getState();
    if (!state || !state.started) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const sx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const sy = (e.clientY - rect.top) * (canvas.height / rect.height);
    const cam = cameraFor(state);
    return {
      x: Math.floor((sx + cam.x) / 16),
      y: Math.floor((sy + cam.y) / 16),
    };
  }

  function aimAt(tile) {
    const state = getState();
    if (!state?.player || !tile) return;
    const px = Math.floor(state.player.x);
    const py = Math.floor(state.player.y);
    const dx = tile.x - px;
    const dy = tile.y - py;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 1) return false;
    if (dx || dy) {
      if (Math.abs(dx) > Math.abs(dy)) state.player.dir = dx > 0 ? 'right' : 'left';
      else state.player.dir = dy > 0 ? 'down' : 'up';
    }
    return true;
  }

  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 && e.button !== 2) return;
    const tile = tileFromEvent(e);
    if (!aimAt(tile)) return;
    if (e.button === 2) press('interact');
    else {
      press('use');
      holdUse = true;
    }
    e.preventDefault();
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) holdUse = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    wheel += e.deltaY > 0 ? 1 : -1;
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => {
    down.clear();
    holdUse = false;
    touch.up = touch.down = touch.left = touch.right = 0;
  });

  function bindHold(el, onDown, onUp) {
    if (!el) return;
    const start = (e) => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      onDown();
    };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', (e) => {
      if (e.buttons) onUp();
    });
  }

  const root = document.getElementById('touch');
  if (root) {
    root.querySelectorAll('[data-dir]').forEach((btn) => {
      const dir = btn.dataset.dir;
      bindHold(btn, () => { touch[dir] = 1; }, () => { touch[dir] = 0; });
    });
    const useBtn = root.querySelector('[data-btn="use"]');
    bindHold(useBtn, () => { press('use'); holdUse = true; }, () => { holdUse = false; });
    const act = root.querySelector('[data-btn="interact"]');
    bindHold(act, () => press('interact'), () => {});
    root.querySelectorAll('[data-btn="inv"],[data-btn="cal"],[data-btn="menu"]').forEach((btn) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const kind = btn.dataset.btn;
        if (kind === 'inv') press('inv');
        else if (kind === 'cal') press('cal');
        else press('close');
      });
    });
  }

  return {
    frame() {
      let x = 0;
      let y = 0;
      if (down.has('left') || touch.left) x -= 1;
      if (down.has('right') || touch.right) x += 1;
      if (down.has('up') || touch.up) y -= 1;
      if (down.has('down') || touch.down) y += 1;
      const slots = pressed.slots.slice();
      const edge = {
        use: pressed.use,
        interact: pressed.interact,
        close: pressed.close,
        inv: pressed.inv,
        cal: pressed.cal,
        give: pressed.give,
        slots,
      };
      const w = wheel;
      return { x, y, pressed: edge, holdUse, wheel: w };
    },
    endFrame() {
      pressed.use = false;
      pressed.interact = false;
      pressed.close = false;
      pressed.inv = false;
      pressed.cal = false;
      pressed.give = false;
      pressed.slots.fill(false);
      wheel = 0;
    },
    press,
  };
}
