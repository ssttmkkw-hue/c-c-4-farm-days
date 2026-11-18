import { PAL, SEASON_LEAF } from '../data/palette.js';

export function px(ctx, x, y, w, h, color) {
  if (!color || w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
}

const LOOK = {
  player: { skin: PAL.skin, hair: '#6b3a22', hat: '#e6c15a', band: '#c4503a', shirt: '#3d6fbf', pants: '#3f7a32', shoes: '#5c3b28', brim: true },
  hua: { skin: '#f0c4a4', hair: '#5a3828', shirt: '#f6edd8', pants: '#c4503a', shoes: '#5c3b28', bun: true, apron: '#c4503a', glasses: true },
  mei: { skin: PAL.skin, hair: '#2c241c', shirt: '#7ec8c3', pants: '#7ec8c3', shoes: '#f3c39a', ribbon: '#e8899a', dress: true },
  lin: { skin: '#e0a878', hair: '#3a2a1c', hat: '#6e4324', shirt: '#8d5a32', pants: '#3d4a6b', shoes: '#2c241c', cap: true },
  wei: { skin: '#e0b090', hair: '#d9d3c7', hat: '#e6c15a', shirt: '#3d4a6b', pants: '#6e5340', shoes: '#3a2a1c', beard: true, brim: true },
  tao: { skin: '#f0c4a4', hair: '#f6f1e6', shirt: '#c9a0d4', pants: '#8d6aa8', shoes: '#5c3b28', bun: true, shawl: '#a67bb8' },
};

export function drawPerson(ctx, x, y, look, dir, step) {
  ctx.save();
  if (dir === 'left') {
    ctx.translate((x | 0) + 16, 0);
    ctx.scale(-1, 1);
    x = 0;
  }
  const L = LOOK[look] || LOOK.player;
  const face = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'side';
  const bob = step % 2;
  ctx.fillStyle = 'rgba(44,36,28,0.28)';
  ctx.fillRect((x | 0) + 3, (y | 0) + 22, 10, 2);

  if (L.hat) {
    px(ctx, x + 3, y + 0, 10, 3, L.hat);
    if (L.brim && face !== 'up') px(ctx, x + 2, y + 3, 12, 2, L.hat);
    if (L.cap && face !== 'up') px(ctx, x + 11, y + 3, 3, 2, L.hat);
    if (L.band) px(ctx, x + 3, y + 2, 10, 1, L.band);
  }

  const hy = y + (L.hat ? 5 : 3);
  if (face === 'up') {
    px(ctx, x + 4, hy, 8, 6, L.hair);
    if (L.bun) px(ctx, x + 6, hy - 3, 4, 3, L.hair);
  } else {
    px(ctx, x + 4, hy, 8, 7, L.skin);
    px(ctx, x + 4, hy, 8, 2, L.hair);
    if (face === 'side') px(ctx, x + 4, hy, 3, 7, L.hair);
    if (L.bun) px(ctx, x + 6, hy - 3, 4, 3, L.hair);
    if (L.ribbon) px(ctx, x + 10, hy - 1, 3, 3, L.ribbon);
    if (face === 'down') {
      px(ctx, x + 5, hy + 3, 2, 2, PAL.ink);
      px(ctx, x + 9, hy + 3, 2, 2, PAL.ink);
      if (L.glasses) {
        px(ctx, x + 4, hy + 3, 4, 2, 'rgba(143,208,234,0.85)');
        px(ctx, x + 8, hy + 3, 4, 2, 'rgba(143,208,234,0.85)');
        px(ctx, x + 5, hy + 3, 1, 1, PAL.ink);
        px(ctx, x + 10, hy + 3, 1, 1, PAL.ink);
      }
      if (L.beard) px(ctx, x + 5, hy + 5, 6, 3, '#e4e0d8');
      else px(ctx, x + 7, hy + 5, 2, 1, '#d4897c');
    } else {
      px(ctx, x + 10, hy + 3, 1, 1, PAL.ink);
      px(ctx, x + 9, hy + 5, 2, 1, '#d4897c');
    }
  }

  const by = hy + 7;
  if (L.dress) {
    px(ctx, x + 3, by, 10, 9, L.shirt);
    px(ctx, x + 4, by, 8, 2, L.ribbon || L.shirt);
    px(ctx, x + 5, by + 8, 2, 2, L.shoes);
    px(ctx, x + 9, by + 8, 2, 2, L.shoes);
  } else {
    px(ctx, x + 4, by, 8, 6, L.shirt);
    if (L.apron) px(ctx, x + 5, by + 2, 6, 4, L.apron);
    if (L.shawl) px(ctx, x + 3, by, 10, 3, L.shawl);
    px(ctx, x + 2, by + 1, 2, 4, L.skin);
    px(ctx, x + 12, by + 1, 2, 4, L.skin);
    const ly = by + 6;
    px(ctx, x + 4, ly, 3, 3 + (bob ? 1 : 0), L.pants);
    px(ctx, x + 9, ly, 3, 3 + (bob ? 0 : 1), L.pants);
    px(ctx, x + 4, ly + 3, 3, 2, L.shoes);
    px(ctx, x + 9, ly + 3, 3, 2, L.shoes);
  }
  ctx.restore();
}

export function drawChicken(ctx, x, y, id, step, hasEgg, peck) {
  const body = id === 'peck' ? '#e08a48' : '#fffaf2';
  const bob = step % 2;
  const neck = peck ? 3 : 0;
  ctx.fillStyle = 'rgba(44,36,28,0.35)';
  ctx.fillRect(x + 3, y + 14, 10, 2);
  px(ctx, x + 2, y + 6 + bob, 10, 7, '#2c241c');
  px(ctx, x + 3, y + 7 + bob, 8, 5, body);
  px(ctx, x + 9, y + 4 + bob + neck, 6, 5, '#2c241c');
  px(ctx, x + 10, y + 5 + bob + neck, 4, 3, body);
  px(ctx, x + 12, y + 3 + bob + neck, 2, 2, '#c4503a');
  px(ctx, x + 14, y + 6 + bob + neck, 2, 2, '#e6c15a');
  px(ctx, x + 12, y + 6 + bob + neck, 1, 1, PAL.ink);
  px(ctx, x + 0, y + 8 + bob, 3, 3, body);
  px(ctx, x + 4, y + 12, 2, 3, '#e6c15a');
  px(ctx, x + 8, y + 12, 2, 3, '#c47a4a');
  if (hasEgg) {
    px(ctx, x - 1, y + 11, 4, 4, '#fffaf2');
    px(ctx, x - 1, y + 14, 4, 1, '#e2c79a');
    px(ctx, x, y + 12, 2, 1, '#f3e2c4');
  }
}

export function drawCow(ctx, x, y, step, hasMilk, swish) {
  const bob = step % 2;
  const tail = swish ? 3 : 0;
  ctx.fillStyle = 'rgba(44,36,28,0.35)';
  ctx.fillRect(x + 1, y + 16, 16, 3);
  px(ctx, x + 0, y + 7, 16, 9, '#2c241c');
  px(ctx, x + 1, y + 8, 14, 7, '#f7f1e4');
  px(ctx, x + 3, y + 9, 4, 3, '#6e4324');
  px(ctx, x + 8, y + 11, 3, 2, '#6e4324');
  px(ctx, x + 5, y + 8, 3, 2, '#5c3b28');
  px(ctx, x + 12, y + 4 + bob, 8, 8, '#2c241c');
  px(ctx, x + 13, y + 5 + bob, 6, 6, '#f7f1e4');
  px(ctx, x + 14, y + 3 + bob, 2, 3, '#e6c15a');
  px(ctx, x + 17, y + 4 + bob, 2, 2, '#e6c15a');
  px(ctx, x + 17, y + 7 + bob, 3, 2, '#e7a090');
  px(ctx, x + 15, y + 6 + bob, 2, 2, '#2c241c');
  px(ctx, x + 13, y + 10 + bob, 2, 2, '#f0c14a');
  px(ctx, x + 2, y + 14, 3, 4, '#2c241c');
  px(ctx, x + 6, y + 14, 3, 4, '#2c241c');
  px(ctx, x + 10, y + 14, 3, 4, '#2c241c');
  px(ctx, x + 2, y + 15, 3, 3, '#f7f1e4');
  px(ctx, x + 6, y + 15, 3, 3, '#f7f1e4');
  px(ctx, x + 10, y + 15, 3, 3, '#6e4324');
  px(ctx, x - 2 + tail, y + 8, 3, 6, '#2c241c');
  px(ctx, x - 3 + tail, y + 13, 4, 2, '#6e4324');
  if (hasMilk) {
    px(ctx, x + 4, y + 13, 6, 3, '#f4a8be');
    px(ctx, x + 5, y + 16, 1, 2, '#f7c1d0');
    px(ctx, x + 8, y + 16, 1, 2, '#f7c1d0');
  }
}

export function drawTree(ctx, sx, sy, season, x, y) {
  px(ctx, sx + 7, sy + 9, 3, 7, '#6e4324');
  px(ctx, sx + 6, sy + 14, 5, 2, '#5c3b28');
  const leaf = SEASON_LEAF[season] || SEASON_LEAF.spring;
  for (let dy = -5; dy <= 3; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const rr = dx * dx + dy * dy * 1.35;
      if (rr > 32) continue;
      if (season === 'winter' && ((dx + dy + x + y) & 3) === 0) continue;
      const alt = ((dx + dy + x) & 3) === 0;
      px(ctx, sx + 8 + dx, sy + 6 + dy, 1, 1, alt ? '#3d7330' : leaf);
    }
  }
  if (season === 'winter') px(ctx, sx + 3, sy + 2, 10, 2, '#fffaf2');
  if (season === 'spring' && ((x + y) & 1) === 0) px(ctx, sx + 4, sy + 5, 2, 2, '#f3b7c4');
  if (season === 'autumn') px(ctx, sx + 10, sy + 4, 2, 2, '#e6c15a');
}

export function drawSprinkler(ctx, x, y) {
  px(ctx, x + 6, y + 8, 4, 6, '#8aa0b4');
  px(ctx, x + 4, y + 12, 8, 3, '#5c6b78');
  px(ctx, x + 2, y + 6, 12, 3, '#3d8ec4');
  px(ctx, x + 7, y + 4, 2, 3, '#d9e6ef');
  px(ctx, x + 1, y + 7, 2, 1, '#8fd0ea');
  px(ctx, x + 13, y + 7, 2, 1, '#8fd0ea');
}

const iconCache = new Map();

export function iconURL(id) {
  if (iconCache.has(id)) return iconCache.get(id);
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  drawIcon(g, id);
  const url = c.toDataURL();
  iconCache.set(id, url);
  return url;
}

function drawIcon(ctx, id) {
  px(ctx, 0, 0, 16, 16, 'rgba(0,0,0,0)');
  if (id === 'hand') {
    px(ctx, 6, 3, 5, 6, PAL.skin);
    px(ctx, 5, 8, 7, 4, PAL.skin);
    px(ctx, 4, 9, 2, 3, PAL.skin);
    return;
  }
  if (id === 'hoe') {
    px(ctx, 8, 2, 2, 12, '#6e4324');
    px(ctx, 4, 2, 8, 3, '#b9c4c9');
    px(ctx, 3, 3, 2, 3, '#8aa0b4');
    return;
  }
  if (id === 'can') {
    px(ctx, 4, 5, 8, 8, '#3d8ec4');
    px(ctx, 6, 3, 4, 3, '#8fd0ea');
    px(ctx, 11, 6, 3, 2, '#d9e6ef');
    px(ctx, 3, 7, 2, 5, '#2c241c');
    return;
  }
  if (id === 'sprinkler') {
    drawSprinkler(ctx, 0, 1);
    return;
  }
  if (id === 'feed') {
    px(ctx, 3, 4, 10, 9, '#c47a4a');
    px(ctx, 4, 6, 8, 2, '#e6c15a');
    px(ctx, 4, 9, 8, 2, '#f0d48a');
    return;
  }
  if (id === 'egg') {
    px(ctx, 5, 3, 6, 10, '#fffaf2');
    px(ctx, 6, 11, 4, 2, '#f3e2c4');
    return;
  }
  if (id === 'cocoa') {
    px(ctx, 5, 3, 6, 2, '#fffaf2');
    px(ctx, 4, 5, 8, 8, '#6e4324');
    px(ctx, 6, 7, 4, 3, '#a56b3c');
    return;
  }
  if (id === 'pumpkin_cake') {
    px(ctx, 3, 6, 10, 6, '#e67a22');
    px(ctx, 3, 5, 10, 2, '#f6edd8');
    px(ctx, 7, 3, 2, 3, '#c4503a');
    return;
  }
  if (id === 'milk') {
    px(ctx, 5, 2, 6, 3, '#fffaf2');
    px(ctx, 4, 5, 8, 8, '#f4efe4');
    px(ctx, 6, 7, 4, 4, '#d9e6ef');
    return;
  }
  if (id && id.startsWith('seed_')) {
    px(ctx, 4, 3, 8, 10, '#a56b3c');
    px(ctx, 6, 5, 4, 4, '#7fbf55');
    px(ctx, 5, 12, 6, 2, '#6e4324');
    return;
  }
  const fruit = {
    turnip: '#f4f0e2',
    cabbage: '#8fd15a',
    tomato: '#e04b3a',
    corn: '#f0d24a',
    pumpkin: '#e67a22',
    sweetpotato: '#d4895c',
    forage_herb: '#6eaf45',
    forage_berry: '#c43b55',
    forage_mushroom: '#e7d2b0',
    forage_cone: '#8d5a32',
  }[id];
  if (fruit) {
    px(ctx, 4, 4, 8, 8, fruit);
    px(ctx, 7, 2, 2, 3, '#3f7a32');
    px(ctx, 3, 8, 2, 2, 'rgba(44,36,28,0.2)');
    return;
  }
  px(ctx, 4, 4, 8, 8, '#d9c4a0');
}
