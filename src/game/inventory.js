import { isTool, sellPrice, stackMax } from '../data/items.js';

export function countItem(state, id) {
  let n = 0;
  for (const s of state.inventory) if (s && s.id === id) n += s.qty;
  return n;
}

export function canFit(state, id, qty) {
  let left = qty;
  const max = stackMax(id);
  for (const s of state.inventory) {
    if (s && s.id === id) left -= Math.max(0, max - s.qty);
  }
  if (left <= 0) return true;
  let empty = 0;
  for (const s of state.inventory) if (!s) empty++;
  return empty * max >= left;
}

export function addItem(state, id, qty) {
  let left = qty;
  if (left <= 0) return true;
  const max = stackMax(id);
  if (isTool(id) && countItem(state, id) > 0) return left === 0;
  for (const s of state.inventory) {
    if (!s || s.id !== id || s.qty >= max) continue;
    const add = Math.min(left, max - s.qty);
    s.qty += add;
    left -= add;
    if (left <= 0) return true;
  }
  for (let i = 0; i < state.inventory.length; i++) {
    if (state.inventory[i]) continue;
    const add = Math.min(left, max);
    state.inventory[i] = { id, qty: add };
    left -= add;
    if (left <= 0) return true;
  }
  return false;
}

export function removeItem(state, id, qty) {
  if (countItem(state, id) < qty) return false;
  let left = qty;
  for (let i = 0; i < state.inventory.length; i++) {
    const s = state.inventory[i];
    if (!s || s.id !== id) continue;
    const take = Math.min(s.qty, left);
    s.qty -= take;
    left -= take;
    if (s.qty <= 0) state.inventory[i] = null;
    if (left <= 0) return true;
  }
  return false;
}

export function selectSlot(state, index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.inventory.length) return false;
  if (!state.inventory[index] && index >= 8) return false;
  if (index < 8) {
    state.hotbar = index;
    return true;
  }
  const cur = state.hotbar;
  const tmp = state.inventory[cur];
  state.inventory[cur] = state.inventory[index];
  state.inventory[index] = tmp;
  return true;
}

export function held(state) {
  return state.inventory[state.hotbar] || null;
}

export function equip(state, id) {
  const idx = state.inventory.findIndex((s) => s && s.id === id);
  if (idx < 0) return false;
  if (idx < 8) {
    state.hotbar = idx;
    return true;
  }
  const cur = state.hotbar;
  const tmp = state.inventory[cur];
  state.inventory[cur] = state.inventory[idx];
  state.inventory[idx] = tmp;
  return true;
}

export function shippingValue(state) {
  return state.shipping.reduce((sum, s) => sum + sellPrice(s.id) * s.qty, 0);
}
