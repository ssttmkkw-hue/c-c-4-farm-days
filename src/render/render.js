import { PAL, SEASON_GRASS, SKY } from '../data/palette.js';
import { CROPS } from '../data/crops.js';
import { t } from '../data/strings.js';
import { phaseOf } from '../game/calendar.js';
import { aimTile, hintTile } from '../game/actions.js';
import { plotAt } from '../game/state.js';
import { getMap } from '../world/maps.js';
import { TILE, VIEW_H, VIEW_W, tileAt } from '../world/tiles.js';
import { drawChicken, drawCow, drawPerson, drawSprinkler, drawTree, px } from '../sprites/sprites.js';

function hash(x, y) {
  return Math.abs((x * 374761393 + y * 668265263) | 0);
}

export function cameraFor(state) {
  const map = getMap(state.location);
  const px = state.player.x * TILE + TILE / 2;
  const py = state.player.y * TILE + TILE / 2;
  let x = Math.round(px - VIEW_W / 2);
  let y = Math.round(py - VIEW_H / 2);
  const maxX = Math.max(0, map.w * TILE - VIEW_W);
  const maxY = Math.max(0, map.h * TILE - VIEW_H);
  x = Math.max(0, Math.min(maxX, x));
  y = Math.max(0, Math.min(maxY, y));
  return { x, y, map };
}

export function fitCanvas(canvas, reserveBottom) {
  const chrome = 28;
  const maxW = Math.max(160, window.innerWidth - chrome);
  const maxH = Math.max(140, window.innerHeight - reserveBottom - 12);
  let scale = Math.floor(Math.min(maxW / VIEW_W, maxH / VIEW_H));
  if (scale < 1) scale = 1;
  if (scale > 5) scale = 5;
  if (canvas.dataset.scale !== String(scale)) {
    canvas.dataset.scale = String(scale);
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    canvas.style.width = VIEW_W * scale + 'px';
    canvas.style.height = VIEW_H * scale + 'px';
  }
  document.documentElement.style.setProperty('--s', String(scale));
  return scale;
}

const FLOOR_DECOR = new Set(['rug', 'mat']);
const SIGN_CHAR = { w: 'well', X: 'bin', B: 'bed', k: 'counter', c: 'chest', P: 'board' };

export function render(ctx, state) {
  ctx.imageSmoothingEnabled = false;
  const { x: camX, y: camY, map } = cameraFor(state);
  const indoor = state.location === 'house' || state.location === 'shop';
  ctx.fillStyle = indoor ? '#b8895c' : skyColor(state);
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (indoor) drawIndoorMargin(ctx, state);

  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const y0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const x1 = Math.min(map.w, Math.ceil((camX + VIEW_W) / TILE) + 1);
  const y1 = Math.min(map.h, Math.ceil((camY + VIEW_H) / TILE) + 1);

  const ents = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const sx = x * TILE - camX;
      const sy = y * TILE - camY;
      drawGround(ctx, state, map, x, y, sx, sy);
      queueProp(ents, ctx, state, map, x, y, sx, sy);
    }
  }

  if (map.decor) {
    for (const d of map.decor) {
      const sx = d.x * TILE - camX;
      const sy = d.y * TILE - camY;
      if (sx < -20 || sy < -20 || sx > VIEW_W + 8 || sy > VIEW_H + 8) continue;
      if (FLOOR_DECOR.has(d.kind)) drawDecorKind(ctx, d.kind, sx, sy);
      else ents.push({ y: d.y + 0.35, draw: () => drawDecorKind(ctx, d.kind, sx, sy) });
    }
  }

  if (state.location === 'farm') {
    ents.push({
      y: 8.2,
      draw: () => drawBarn(ctx, 13 * TILE - camX, 7 * TILE - camY),
    });
    for (const sp of state.sprinklers) {
      ents.push({ y: sp.y, draw: () => drawSprinkler(ctx, sp.x * TILE - camX, sp.y * TILE - camY) });
    }
    for (const a of state.animals) {
      ents.push({
        y: a.y,
        draw: () => {
          const sx = Math.round(a.x * TILE - camX);
          const sy = Math.round(a.y * TILE - camY);
          const phase = Math.floor(state.time / 8 + a.x * 5);
          const step = phase % 2;
          const hop = phase % 9 === 0 ? -1 : 0;
          if (a.type === 'cow') drawCow(ctx, sx, sy + hop, step, a.hasMilk, phase % 4 === 0);
          else drawChicken(ctx, sx, sy + hop, a.id, step, a.hasEgg, a.dir === 'idle' || phase % 6 === 0);
        },
      });
    }
  }
  for (const n of state.npcs) {
    if (n.map !== state.location) continue;
    ents.push({
      y: n.y,
      draw: () => {
        const sx = Math.round(n.x * TILE - camX);
        const sy = Math.round(n.y * TILE - camY) - 10;
        const step = n.pause > 0 ? 0 : Math.floor(state.time / 20) % 2;
        drawPerson(ctx, sx, sy, n.look, n.dir, step);
      },
    });
  }
  ents.push({
    y: state.player.y,
    draw: () => {
      const sx = Math.round(state.player.x * TILE - camX);
      const sy = Math.round(state.player.y * TILE - camY) - 10;
      const step = state.player.moving ? Math.floor((state.player.walk || 0) * 8) % 2 : 0;
      drawPerson(ctx, sx, sy, 'player', state.player.dir, step);
    },
  });
  if (state.location === 'farm') {
    const px = Math.floor(state.player.x);
    const py = Math.floor(state.player.y);
    for (const plot of Object.values(state.plots || {})) {
      if (!plot.crop) continue;
      const sx = plot.x * TILE - camX;
      const sy = plot.y * TILE - camY;
      if (sx < -16 || sy < -16 || sx > VIEW_W || sy > VIEW_H) continue;
      const onTile = plot.x === px && plot.y === py;
      ents.push({
        y: onTile ? state.player.y + 0.04 : plot.y + 0.02,
        draw: () => drawCrop(ctx, sx, sy, plot),
      });
    }
  }
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e.draw();

  if (!state.panel && state.screen === 'play') {
    const aim = aimTile(state);
    const ax = aim.x * TILE - camX;
    const ay = aim.y * TILE - camY;
    ctx.strokeStyle = '#ffe7a0';
    ctx.lineWidth = 1;
    ctx.strokeRect(ax + 0.5, ay + 0.5, 15, 15);
  }

  drawSigns(ctx, state, map, camX, camY, x0, y0, x1, y1);
  drawAtmosphere(ctx, state);
}

function skyColor(state) {
  const phase = phaseOf(state.time);
  if (phase === 'night') return SKY.night;
  if (phase === 'evening') return SKY.evening;
  return SKY[state.season] || SKY.spring;
}

function drawGround(ctx, state, map, x, y, sx, sy) {
  const ch = tileAt(map, x, y);
  const season = state.season;
  const g = SEASON_GRASS[season] || SEASON_GRASS.spring;
  if (ch === '.' || ch === 'f' || ch === 'g') {
    px(ctx, sx, sy, 16, 16, (hash(x, y) & 3) === 0 ? g.b : g.a);
    if ((hash(x + 2, y) & 7) === 0) px(ctx, sx + 3, sy + 10, 2, 3, g.c);
    if ((hash(x, y + 5) & 11) === 0 && season !== 'winter') {
      const flower = season === 'autumn' ? '#e6c15a' : season === 'summer' ? '#f3b7c4' : '#fffaf2';
      px(ctx, sx + 8, sy + 6, 2, 2, flower);
    }
    if (season === 'winter' && (hash(x, y) & 5) === 0) px(ctx, sx + 5, sy + 4, 3, 2, PAL.white);
    if (ch === 'f') drawForage(ctx, state, x, y, sx, sy);
    if (state.location === 'farm' && y === 10 && (x === 15 || x === 16)) drawHay(ctx, sx, sy);
    return;
  }
  if (ch === ',') {
    px(ctx, sx, sy, 16, 16, season === 'winter' ? '#c5d0d4' : PAL.path);
    px(ctx, sx, sy + 15, 16, 1, season === 'winter' ? '#aeb8bc' : PAL.pathDark);
    if ((hash(x, y) & 3) === 0) px(ctx, sx + 4, sy + 6, 2, 1, PAL.pathDark);
    if (season === 'winter') px(ctx, sx + 2, sy + 3, 4, 1, 'rgba(255,255,255,0.45)');
    return;
  }
  if (ch === 's') {
    drawSoil(ctx, state, x, y, sx, sy);
    return;
  }
  if (ch === '~') {
    const wob = Math.floor(state.time / 25 + x) % 2;
    px(ctx, sx, sy, 16, 16, PAL.water);
    px(ctx, sx, sy + 4 + wob, 16, 2, PAL.waterLite);
    px(ctx, sx + wob * 3, sy + 10, 6, 1, 'rgba(255,255,255,0.35)');
    return;
  }
  if (ch === 'F') {
    const plank = (hash(x, y) & 5) === 0 ? '#d7b483' : '#c9a36a';
    px(ctx, sx, sy, 16, 16, plank);
    px(ctx, sx, sy + 5, 16, 1, '#a56b3c');
    px(ctx, sx, sy + 12, 16, 1, '#a56b3c');
    if (tileAt(map, x, y - 1) === '#') px(ctx, sx, sy, 16, 3, '#6a4a30');
    if (tileAt(map, x, y + 1) === '#') px(ctx, sx, sy + 13, 16, 3, '#6a4a30');
    return;
  }
  if (ch === '#') {
    px(ctx, sx, sy, 16, 16, '#6e5340');
    px(ctx, sx + 2, sy + 2, 12, 4, '#8a6a4a');
    px(ctx, sx + 2, sy + 9, 12, 4, '#8a6a4a');
    return;
  }
  if (ch === 'T') {
    const edge = x === 0 || y === 0 || x === map.w - 1 || y === map.h - 1;
    if (edge && ((x + y) & 1) === 1) {
      px(ctx, sx, sy, 16, 16, season === 'winter' ? '#8ea3ab' : '#2f5d28');
      px(ctx, sx, sy + 12, 16, 4, '#244622');
    } else {
      px(ctx, sx, sy, 16, 16, (SEASON_GRASS[season] || SEASON_GRASS.spring).b);
    }
    return;
  }
  px(ctx, sx, sy, 16, 16, g.b);
}

function queueProp(ents, ctx, state, map, x, y, sx, sy) {
  const ch = tileAt(map, x, y);
  const indoor = state.location === 'house' || state.location === 'shop';
  if (ch === '=' || ch === 'g') {
    ents.push({ y: y + 0.55, draw: () => drawFence(ctx, map, x, y, sx, sy, ch === 'g') });
  } else if (ch === 'H' || (ch === 'D' && !indoor)) {
    ents.push({ y: y + 0.9, draw: () => drawHouse(ctx, map, x, y, sx, sy, ch) });
  } else if (ch === 'D') {
    ents.push({ y: y + 0.7, draw: () => drawIndoorDoor(ctx, sx, sy) });
  } else if (ch === 'w') {
    ents.push({ y: y + 0.45, draw: () => drawWell(ctx, sx, sy) });
  } else if (ch === 'X') {
    ents.push({ y: y + 0.45, draw: () => drawBin(ctx, sx, sy) });
  } else if (ch === 'c') {
    ents.push({ y: y + 0.45, draw: () => drawChest(ctx, sx, sy) });
  } else if (ch === 'B') {
    ents.push({ y: y + 0.45, draw: () => drawBed(ctx, sx, sy) });
  } else if (ch === 'k') {
    ents.push({ y: y + 0.5, draw: () => drawCounter(ctx, sx, sy) });
  } else if (ch === 'P') {
    ents.push({ y: y + 0.45, draw: () => drawBoard(ctx, sx, sy) });
  } else if (canopyTree(map, x, y)) {
    ents.push({ y: y + 0.8, draw: () => drawTree(ctx, sx, sy, state.season, x, y) });
  }
}

function canopyTree(map, x, y) {
  if (tileAt(map, x, y) !== 'T') return false;
  const edge = x === 0 || y === 0 || x === map.w - 1 || y === map.h - 1;
  return !(edge && ((x + y) & 1) === 1);
}

function drawSoil(ctx, state, x, y, sx, sy) {
  const plot = plotAt(state, x, y);
  const tilled = !!(plot && plot.tilled);
  const wet = !!(plot && plot.watered && tilled);
  if (!tilled) {
    const winter = state.season === 'winter';
    px(ctx, sx, sy, 16, 16, winter ? '#b7c4c4' : '#4f8a34');
    px(ctx, sx + 1, sy + 2, 14, 12, winter ? '#d5dde0' : '#8a5a32');
    px(ctx, sx + 3, sy + 4, 10, 8, winter ? '#e7eef0' : '#c48955');
    px(ctx, sx, sy, 16, 1, winter ? '#8ea3ab' : '#2f6a24');
    px(ctx, sx, sy + 15, 16, 1, winter ? '#8ea3ab' : '#2f6a24');
    return;
  }
  px(ctx, sx, sy, 16, 16, wet ? '#2a160e' : '#d08948');
  px(ctx, sx, sy, 16, 2, wet ? '#1a0e0a' : '#a86a32');
  const furrow = wet ? '#120c09' : '#5c3418';
  px(ctx, sx + 1, sy + 5, 14, 2, furrow);
  px(ctx, sx + 1, sy + 9, 14, 2, furrow);
  px(ctx, sx + 1, sy + 13, 14, 2, furrow);
  if (wet) {
    px(ctx, sx + 2, sy + 3, 6, 1, '#7eb6d4');
    px(ctx, sx + 9, sy + 7, 5, 1, '#3d78a0');
    px(ctx, sx + 4, sy + 11, 4, 1, '#c5e6f4');
  } else {
    px(ctx, sx + 2, sy + 3, 5, 1, '#f0c08a');
  }
}

function drawCrop(ctx, sx, sy, plot) {
  const def = CROPS[plot.crop];
  if (!def) return;
  if (plot.wilted) {
    px(ctx, sx + 6, sy + 7, 4, 7, '#6e5340');
    px(ctx, sx + 2, sy + 6, 6, 3, '#8a6a4a');
    px(ctx, sx + 9, sy + 7, 5, 3, '#5c4030');
    px(ctx, sx + 4, sy + 4, 2, 4, '#4a3428');
    return;
  }
  px(ctx, sx + 3, sy + 11, 10, 4, '#4a2e1c');
  px(ctx, sx + 5, sy + 12, 6, 2, '#2c1a10');
  if (plot.stage <= 0) {
    px(ctx, sx + 6, sy + 4, 2, 8, '#d6f58a');
    px(ctx, sx + 4, sy + 3, 5, 3, '#8fd15a');
    px(ctx, sx + 3, sy + 4, 2, 2, '#2f6a24');
    px(ctx, sx + 10, sy + 5, 2, 7, '#c6ef70');
    px(ctx, sx + 9, sy + 4, 4, 3, '#3f7a32');
    px(ctx, sx + 7, sy + 12, 2, 2, '#fffaf2');
    return;
  }
  const ready = plot.stage >= def.days;
  const showing = plot.stage >= Math.max(1, def.days - 1);
  px(ctx, sx + 7, sy + 2, 2, 11, '#246024');
  px(ctx, sx + 1, sy + 5, 6, 5, def.leaf);
  px(ctx, sx + 9, sy + 6, 6, 5, def.leaf);
  px(ctx, sx + 3, sy + 4, 4, 3, '#e7f8b0');
  px(ctx, sx + 10, sy + 5, 3, 2, '#e7f8b0');
  if (showing || plot.stage >= 2) {
    px(ctx, sx, sy + 8, 6, 4, def.leaf);
    px(ctx, sx + 10, sy + 9, 6, 4, def.leaf);
    px(ctx, sx + 5, sy + 1, 6, 4, def.leaf);
  }
  if (ready) {
    if (plot.crop === 'corn') {
      px(ctx, sx + 5, sy + 0, 6, 10, def.fruit);
      px(ctx, sx + 6, sy + 2, 4, 6, '#fff3b0');
      px(ctx, sx + 2, sy + 3, 3, 6, def.leaf);
      px(ctx, sx + 11, sy + 3, 3, 6, def.leaf);
    } else if (plot.crop === 'cabbage') {
      px(ctx, sx + 2, sy + 4, 12, 9, def.fruit);
      px(ctx, sx + 5, sy + 6, 6, 4, '#e7f8b0');
    } else if (plot.crop === 'pumpkin') {
      px(ctx, sx + 2, sy + 6, 12, 8, def.fruit);
      px(ctx, sx + 6, sy + 4, 4, 3, '#3f7a32');
      px(ctx, sx + 4, sy + 8, 3, 2, '#f6c56a');
    } else if (plot.crop === 'tomato') {
      px(ctx, sx + 3, sy + 6, 5, 5, def.fruit);
      px(ctx, sx + 8, sy + 8, 5, 5, def.fruit);
      px(ctx, sx + 6, sy + 4, 4, 4, '#ff6a4a');
    } else {
      px(ctx, sx + 2, sy + 7, 12, 7, def.fruit);
      px(ctx, sx + 4, sy + 8, 8, 4, '#fffaf2');
      px(ctx, sx + 6, sy + 3, 4, 5, def.leaf);
    }
    return;
  }
  if (showing) {
    px(ctx, sx + 4, sy + 10, 8, 4, def.fruit);
    px(ctx, sx + 6, sy + 9, 4, 2, '#fffaf2');
  }
}

function drawForage(ctx, state, x, y, sx, sy) {
  const key = state.location + ':' + x + ',' + y;
  if (state.forage && state.forage[key]) return;
  const season = state.season;
  if (season === 'winter') {
    px(ctx, sx + 6, sy + 8, 4, 5, '#8d5a32');
    px(ctx, sx + 5, sy + 6, 6, 3, '#6e4324');
    return;
  }
  if (season === 'summer') {
    px(ctx, sx + 5, sy + 8, 6, 4, '#3f7a32');
    px(ctx, sx + 6, sy + 6, 2, 2, '#c43b55');
    px(ctx, sx + 9, sy + 7, 2, 2, '#e04b3a');
    return;
  }
  if (season === 'autumn') {
    px(ctx, sx + 6, sy + 8, 5, 4, '#e7d2b0');
    px(ctx, sx + 7, sy + 7, 3, 2, '#c4503a');
    return;
  }
  px(ctx, sx + 6, sy + 7, 2, 6, '#3f7a32');
  px(ctx, sx + 4, sy + 6, 3, 2, '#8fd15a');
  px(ctx, sx + 8, sy + 5, 3, 2, '#6eaf45');
}

function drawHouse(ctx, map, x, y, sx, sy, ch) {
  const above = tileAt(map, x, y - 1);
  const roof = above !== 'H' && above !== 'D';
  if (roof) {
    px(ctx, sx, sy, 16, 5, PAL.roof);
    px(ctx, sx, sy + 5, 16, 2, PAL.roofDark);
    px(ctx, sx + 1, sy + 7, 14, 9, PAL.wall);
  } else {
    px(ctx, sx, sy, 16, 16, PAL.wall);
  }
  px(ctx, sx, sy + (roof ? 7 : 0), 1, roof ? 9 : 16, '#e2c79a');
  px(ctx, sx + 15, sy + (roof ? 7 : 0), 1, roof ? 9 : 16, '#e2c79a');
  if (ch === 'D') {
    px(ctx, sx + 5, sy + 6, 6, 10, '#6e4324');
    px(ctx, sx + 6, sy + 7, 4, 8, '#a56b3c');
    px(ctx, sx + 8, sy + 11, 1, 1, PAL.gold);
  } else if ((hash(x, y) % 5) === 0) {
    px(ctx, sx + 4, sy + 8, 6, 4, '#8fd0ea');
    px(ctx, sx + 6, sy + 8, 1, 4, PAL.wall);
    px(ctx, sx + 4, sy + 10, 6, 1, PAL.wall);
  }
}

function drawFence(ctx, map, x, y, sx, sy, open) {
  const join = (ch) => ch === '=' || ch === 'g';
  const n = join(tileAt(map, x, y - 1));
  const s = join(tileAt(map, x, y + 1));
  const w = join(tileAt(map, x - 1, y));
  const e = join(tileAt(map, x + 1, y));
  if (open) {
    px(ctx, sx + 1, sy + 5, 3, 9, '#f3e2c4');
    px(ctx, sx + 12, sy + 5, 3, 9, '#f3e2c4');
    px(ctx, sx + 1, sy + 12, 3, 3, '#a56b3c');
    px(ctx, sx + 12, sy + 12, 3, 3, '#a56b3c');
    return;
  }
  px(ctx, sx + 6, sy + 2, 4, 12, '#f3e2c4');
  if (w || e) px(ctx, sx, sy + 5, 16, 2, '#e2c79a');
  if (w || e) px(ctx, sx, sy + 10, 16, 2, '#c9a36a');
  if (n) px(ctx, sx + 7, sy, 2, 8, '#e2c79a');
  if (s) px(ctx, sx + 7, sy + 8, 2, 8, '#e2c79a');
  px(ctx, sx + 6, sy + 12, 4, 3, '#a56b3c');
}

function drawWell(ctx, sx, sy) {
  px(ctx, sx - 1, sy + 5, 18, 11, '#5c3b28');
  px(ctx, sx + 1, sy + 7, 14, 8, '#d5ddd4');
  px(ctx, sx + 3, sy + 9, 10, 5, '#2f78b0');
  px(ctx, sx + 4, sy + 10, 8, 2, '#b7e4f6');
  px(ctx, sx + 2, sy + 5, 12, 3, '#8a8f86');
  px(ctx, sx + 7, sy + 0, 2, 7, '#5c3b28');
  px(ctx, sx + 3, sy + 0, 10, 3, '#6e4324');
  px(ctx, sx + 4, sy + 1, 8, 1, '#e6c15a');
}

function drawBin(ctx, sx, sy) {
  px(ctx, sx, sy + 4, 16, 12, '#5c3b28');
  px(ctx, sx + 1, sy + 6, 14, 9, '#c4844e');
  px(ctx, sx + 1, sy + 6, 14, 3, '#e0a060');
  px(ctx, sx, sy + 4, 16, 2, '#8d3428');
  px(ctx, sx + 4, sy + 0, 8, 6, '#f0c14a');
  px(ctx, sx + 6, sy + 1, 4, 4, '#fffaf2');
  px(ctx, sx + 7, sy + 2, 2, 2, '#c4503a');
}

function drawChest(ctx, sx, sy) {
  px(ctx, sx + 1, sy + 5, 14, 10, '#6e4324');
  px(ctx, sx + 2, sy + 6, 12, 8, '#c4844e');
  px(ctx, sx + 2, sy + 6, 12, 3, '#e0a060');
  px(ctx, sx + 7, sy + 9, 2, 2, PAL.gold);
}

function drawBed(ctx, sx, sy) {
  px(ctx, sx, sy + 2, 16, 14, '#5c3b28');
  px(ctx, sx + 1, sy + 5, 14, 10, '#fffaf2');
  px(ctx, sx + 1, sy + 8, 14, 7, '#d45340');
  px(ctx, sx + 2, sy + 5, 6, 4, '#f6edd8');
  px(ctx, sx + 10, sy + 3, 4, 3, '#e6c15a');
}

function drawCounter(ctx, sx, sy) {
  px(ctx, sx, sy + 1, 16, 4, '#c4503a');
  px(ctx, sx, sy + 4, 16, 1, '#f6edd8');
  px(ctx, sx, sy + 5, 16, 11, '#6e4324');
  px(ctx, sx + 1, sy + 6, 14, 8, '#d49255');
  px(ctx, sx + 2, sy + 7, 4, 3, '#fffaf2');
  px(ctx, sx + 8, sy + 7, 5, 3, '#7fbf55');
  px(ctx, sx + 6, sy + 11, 4, 2, '#e6c15a');
}

function drawIndoorDoor(ctx, sx, sy) {
  px(ctx, sx, sy, 16, 16, '#3a2718');
  px(ctx, sx + 2, sy + 1, 12, 15, '#a56b3c');
  px(ctx, sx + 3, sy + 2, 10, 7, '#c4844e');
  px(ctx, sx + 10, sy + 9, 2, 2, '#e6c15a');
  px(ctx, sx, sy, 16, 2, '#2c241c');
}

function drawBoard(ctx, sx, sy) {
  px(ctx, sx + 7, sy + 6, 2, 10, '#6e4324');
  px(ctx, sx + 2, sy + 2, 12, 8, '#f6edd8');
  px(ctx, sx + 3, sy + 3, 10, 1, '#c4503a');
  px(ctx, sx + 4, sy + 6, 8, 1, '#a67c3d');
}

function drawAtmosphere(ctx, state) {
  const phase = phaseOf(state.time);
  if (phase === 'morning') fill(ctx, '#ffd7a1', 0.1);
  else if (phase === 'evening') fill(ctx, '#e07038', 0.18);
  else if (phase === 'night') fill(ctx, '#0c1430', state.season === 'winter' ? 0.38 : 0.45);
  if (state.weather === 'rain') {
    fill(ctx, '#20344e', 0.12);
    for (let i = 0; i < 48; i++) {
      const rx = (i * 47 + Math.floor(state.time * 4)) % VIEW_W;
      const ry = (i * 29 + Math.floor(state.time * 9)) % VIEW_H;
      px(ctx, rx, ry, 1, 3, 'rgba(230,240,255,0.55)');
    }
  } else if (state.weather === 'snow') {
    fill(ctx, '#d5e2ea', 0.12);
    for (let i = 0; i < 36; i++) {
      const rx = (i * 53 + Math.floor(state.time)) % VIEW_W;
      const ry = (i * 37 + Math.floor(state.time * 2)) % VIEW_H;
      px(ctx, rx, ry, 2, 2, 'rgba(255,255,255,0.8)');
    }
  } else if (state.weather === 'cloudy' && phase !== 'night') {
    fill(ctx, '#90a0ae', 0.08);
  }
}

function fill(ctx, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

function drawHay(ctx, sx, sy) {
  px(ctx, sx + 2, sy + 6, 12, 8, '#e6c15a');
  px(ctx, sx + 3, sy + 4, 10, 4, '#f3d98a');
  px(ctx, sx + 4, sy + 9, 8, 3, '#c47a4a');
}

function drawBarn(ctx, sx, sy) {
  const w = 16 * 6;
  px(ctx, sx, sy, w, 8, '#c4503a');
  px(ctx, sx, sy + 8, w, 4, '#8d3428');
  px(ctx, sx + 4, sy + 12, 4, 18, '#f3e2c4');
  px(ctx, sx + w - 8, sy + 12, 4, 18, '#f3e2c4');
  px(ctx, sx + 18, sy + 16, 22, 12, '#f0d48a');
  px(ctx, sx + 44, sy + 18, 18, 10, '#e6c15a');
  px(ctx, sx + 24, sy + 14, 10, 6, '#c47a4a');
  px(ctx, sx + w / 2 - 8, sy + 1, 16, 6, '#f6edd8');
  px(ctx, sx + w / 2 - 6, sy + 2, 12, 1, '#c4503a');
}

function drawIndoorMargin(ctx) {
  px(ctx, 0, 0, VIEW_W, 8, '#4a3428');
  px(ctx, 0, VIEW_H - 8, VIEW_W, 8, '#4a3428');
  px(ctx, 0, 0, 8, VIEW_H, '#4a3428');
  px(ctx, VIEW_W - 8, 0, 8, VIEW_H, '#4a3428');
}

function drawDecorKind(ctx, kind, sx, sy) {
  if (kind === 'rug') {
    px(ctx, sx, sy, 16, 16, '#7a2e28');
    px(ctx, sx + 2, sy + 2, 12, 12, '#c4503a');
    px(ctx, sx + 5, sy + 5, 6, 6, '#e6c15a');
    return;
  }
  if (kind === 'mat') {
    px(ctx, sx + 1, sy + 5, 14, 8, '#7a2e28');
    px(ctx, sx + 3, sy + 7, 10, 4, '#e6c15a');
    return;
  }
  if (kind === 'table') {
    px(ctx, sx + 1, sy + 6, 14, 8, '#5c3b28');
    px(ctx, sx + 2, sy + 3, 12, 5, '#d49255');
    px(ctx, sx + 3, sy + 4, 3, 2, '#fffaf2');
    px(ctx, sx + 9, sy + 4, 3, 2, '#e04b3a');
    return;
  }
  if (kind === 'plant') {
    px(ctx, sx + 5, sy + 9, 6, 6, '#a56b3c');
    px(ctx, sx + 3, sy + 4, 10, 6, '#2f6a24');
    px(ctx, sx + 5, sy + 2, 6, 4, '#8fd15a');
    px(ctx, sx + 2, sy + 6, 4, 3, '#6eaf45');
    return;
  }
  if (kind === 'shelf') {
    px(ctx, sx, sy + 3, 16, 12, '#5c3b28');
    px(ctx, sx, sy + 3, 16, 3, '#c4844e');
    px(ctx, sx + 2, sy + 8, 3, 3, '#e04b3a');
    px(ctx, sx + 7, sy + 8, 3, 3, '#f0d24a');
    px(ctx, sx + 11, sy + 8, 3, 3, '#7fbf55');
    return;
  }
  if (kind === 'lamp') {
    px(ctx, sx + 7, sy + 7, 2, 8, '#6e4324');
    px(ctx, sx + 3, sy + 2, 10, 6, '#f0d24a');
    px(ctx, sx + 5, sy + 3, 6, 3, '#fffaf2');
    return;
  }
  if (kind === 'window') {
    px(ctx, sx + 2, sy + 3, 12, 10, '#7ec8ea');
    px(ctx, sx + 7, sy + 3, 2, 10, '#f3e2c4');
    px(ctx, sx + 2, sy + 7, 12, 2, '#f3e2c4');
    px(ctx, sx + 1, sy + 2, 14, 1, '#6e4324');
    px(ctx, sx + 1, sy + 13, 14, 1, '#6e4324');
    return;
  }
  if (kind === 'crate') {
    px(ctx, sx + 2, sy + 5, 12, 10, '#a56b3c');
    px(ctx, sx + 2, sy + 5, 12, 3, '#e0a060');
    px(ctx, sx + 4, sy + 9, 8, 1, '#6e4324');
    px(ctx, sx + 7, sy + 6, 1, 8, '#6e4324');
  }
}

function signAnchor(map, x, y, ch) {
  return tileAt(map, x - 1, y) !== ch && tileAt(map, x, y - 1) !== ch;
}

function interactKey(state) {
  if (state.touch === 'off') return 'E';
  if (state.touch === 'on') return 'B';
  if (typeof window !== 'undefined' && (window.innerWidth < 820 || window.matchMedia('(pointer: coarse)').matches)) return 'B';
  return 'E';
}

function drawPlate(ctx, cx, sy, text, hot) {
  ctx.save();
  ctx.font = 'bold 8px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
  ctx.textBaseline = 'top';
  const w = Math.min(78, Math.ceil(ctx.measureText(text).width) + 6);
  const h = 11;
  const x = Math.round(cx - w / 2);
  const y = Math.round(sy);
  px(ctx, x, y, w, h, hot ? '#e6c15a' : '#fffaf2');
  px(ctx, x, y, w, 1, '#2c241c');
  px(ctx, x, y + h - 1, w, 1, '#2c241c');
  px(ctx, x, y, 1, h, '#2c241c');
  px(ctx, x + w - 1, y, 1, h, '#2c241c');
  ctx.fillStyle = '#2c241c';
  ctx.fillText(text, x + 3, y + 1);
  ctx.restore();
}

function drawSigns(ctx, state, map, camX, camY, x0, y0, x1, y1) {
  const lang = state.lang === 'en' ? 'en' : 'zh';
  const hint = hintTile(state);
  const bob = hint ? (Math.floor(state.time * 1.4) % 2) : 0;
  const indoor = state.location === 'house' || state.location === 'shop';
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const ch = tileAt(map, x, y);
      let id = SIGN_CHAR[ch];
      if (ch === 'D') id = indoor ? 'exit' : 'enter';
      if (!id || !signAnchor(map, x, y, ch)) continue;
      const near = hint && !hint.float && hint.id === id && Math.abs(hint.x - x) + Math.abs(hint.y - y) <= 12;
      const label = (near ? interactKey(state) + ' ' : '') + t(lang, 'sign_' + id);
      drawPlate(ctx, x * TILE - camX + 8, y * TILE - camY - 12 - (near ? bob : 0), label, !!near);
    }
  }
  if (hint && hint.float) {
    const label = interactKey(state) + ' ' + t(lang, 'sign_' + hint.id);
    drawPlate(ctx, hint.x * TILE - camX + 8, hint.y * TILE - camY - 18 - bob, label, true);
  }
}
