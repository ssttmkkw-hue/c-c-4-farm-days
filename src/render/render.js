import { PAL, SEASON_GRASS, SKY } from '../data/palette.js';
import { CROPS } from '../data/crops.js';
import { phaseOf } from '../game/calendar.js';
import { aimTile } from '../game/actions.js';
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
  const maxW = Math.max(160, window.innerWidth - 8);
  const maxH = Math.max(160, window.innerHeight - reserveBottom);
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
  return scale;
}

export function render(ctx, state) {
  ctx.imageSmoothingEnabled = false;
  const { x: camX, y: camY, map } = cameraFor(state);
  const sky = skyColor(state);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const y0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const x1 = Math.min(map.w, Math.ceil((camX + VIEW_W) / TILE) + 1);
  const y1 = Math.min(map.h, Math.ceil((camY + VIEW_H) / TILE) + 1);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      drawGround(ctx, state, map, x, y, x * TILE - camX, y * TILE - camY);
    }
  }
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      drawProp(ctx, state, map, x, y, x * TILE - camX, y * TILE - camY);
    }
  }

  const ents = [];
  if (state.location === 'farm') {
    for (const sp of state.sprinklers) {
      ents.push({ y: sp.y, draw: () => drawSprinkler(ctx, sp.x * TILE - camX, sp.y * TILE - camY) });
    }
    for (const a of state.animals) {
      ents.push({
        y: a.y,
        draw: () => {
          const sx = Math.round(a.x * TILE - camX);
          const sy = Math.round(a.y * TILE - camY);
          const step = Math.floor(state.time / 30 + a.x * 4) % 2;
          if (a.type === 'cow') drawCow(ctx, sx, sy, step, a.hasMilk);
          else drawChicken(ctx, sx, sy, a.id, step, a.hasEgg);
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
  ents.sort((a, b) => a.y - b.y);
  for (const e of ents) e.draw();

  if (!state.panel && state.screen === 'play') {
    const aim = aimTile(state);
    const ax = aim.x * TILE - camX;
    const ay = aim.y * TILE - camY;
    ctx.strokeStyle = 'rgba(255,250,242,0.55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(ax + 0.5, ay + 0.5, 15, 15);
  }

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
    if (ch === 'g') drawFence(ctx, map, x, y, sx, sy, true);
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
    px(ctx, sx, sy, 16, 16, '#c9a36a');
    px(ctx, sx, sy + 4, 16, 1, '#a56b3c');
    px(ctx, sx, sy + 11, 16, 1, '#a56b3c');
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
      drawTree(ctx, sx, sy, season, x, y);
    }
    return;
  }
  px(ctx, sx, sy, 16, 16, g.b);
}

function drawProp(ctx, state, map, x, y, sx, sy) {
  const ch = tileAt(map, x, y);
  if (ch === 'H' || ch === 'D') drawHouse(ctx, map, x, y, sx, sy, ch);
  else if (ch === '=') drawFence(ctx, map, x, y, sx, sy, false);
  else if (ch === 'w') drawWell(ctx, sx, sy);
  else if (ch === 'X') drawBin(ctx, sx, sy);
  else if (ch === 'c') drawChest(ctx, sx, sy);
  else if (ch === 'B') drawBed(ctx, sx, sy);
  else if (ch === 'k') drawCounter(ctx, sx, sy);
  else if (ch === 'P') drawBoard(ctx, sx, sy);
}

function drawSoil(ctx, state, x, y, sx, sy) {
  const plot = plotAt(state, x, y);
  const wet = plot && plot.watered;
  px(ctx, sx, sy, 16, 16, wet ? PAL.soilWet : PAL.soil);
  px(ctx, sx, sy, 16, 1, '#6e8a48');
  if (plot && plot.tilled) {
    const line = wet ? '#2a1a12' : PAL.soilDark;
    px(ctx, sx + 2, sy + 4, 12, 1, line);
    px(ctx, sx + 2, sy + 8, 12, 1, line);
    px(ctx, sx + 2, sy + 12, 12, 1, line);
  }
  if (plot && plot.crop) drawCrop(ctx, sx, sy, plot);
  if (wet) px(ctx, sx + 12, sy + 2, 2, 1, PAL.waterLite);
}

function drawCrop(ctx, sx, sy, plot) {
  const def = CROPS[plot.crop];
  if (!def) return;
  if (plot.wilted) {
    px(ctx, sx + 7, sy + 8, 2, 6, '#8a6a4a');
    px(ctx, sx + 4, sy + 6, 4, 2, '#6e5340');
    px(ctx, sx + 9, sy + 7, 3, 2, '#6e5340');
    return;
  }
  if (plot.stage <= 0) {
    px(ctx, sx + 5, sy + 8, 2, 2, '#3e291c');
    px(ctx, sx + 9, sy + 10, 2, 2, '#3e291c');
    return;
  }
  const ready = plot.stage >= def.days;
  const mid = plot.stage >= Math.ceil(def.days / 2);
  px(ctx, sx + 7, sy + 8, 2, 6, '#3f7a32');
  if (!mid) {
    px(ctx, sx + 5, sy + 7, 3, 3, def.leaf);
    px(ctx, sx + 9, sy + 8, 2, 2, def.leaf);
    return;
  }
  px(ctx, sx + 3, sy + 6, 4, 4, def.leaf);
  px(ctx, sx + 9, sy + 7, 4, 3, def.leaf);
  if (ready) {
    if (plot.crop === 'corn') {
      px(ctx, sx + 6, sy + 2, 4, 7, def.fruit);
      px(ctx, sx + 7, sy + 3, 2, 5, '#f6e27a');
    } else if (plot.crop === 'cabbage') {
      px(ctx, sx + 4, sy + 5, 8, 6, def.fruit);
    } else if (plot.crop === 'pumpkin') {
      px(ctx, sx + 4, sy + 7, 8, 6, def.fruit);
      px(ctx, sx + 7, sy + 6, 2, 2, '#3f7a32');
    } else {
      px(ctx, sx + 4, sy + 8, 4, 4, def.fruit);
      px(ctx, sx + 9, sy + 9, 3, 3, def.fruit);
    }
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
  if (!open) px(ctx, sx + 6, sy + 3, 4, 12, '#f3e2c4');
  else px(ctx, sx + 2, sy + 10, 12, 3, '#f3e2c4');
  if (w || e) px(ctx, sx, sy + 5, 16, 2, '#e2c79a');
  if (w || e) px(ctx, sx, sy + 10, 16, 2, '#c9a36a');
  if (n) px(ctx, sx + 7, sy, 2, 8, '#e2c79a');
  if (s && !open) px(ctx, sx + 7, sy + 8, 2, 8, '#e2c79a');
  px(ctx, sx + 6, sy + 12, 4, 3, '#a56b3c');
}

function drawWell(ctx, sx, sy) {
  px(ctx, sx + 2, sy + 6, 12, 8, '#b9c0b4');
  px(ctx, sx + 4, sy + 8, 8, 4, PAL.water);
  px(ctx, sx + 3, sy + 4, 10, 3, '#8a8f86');
  px(ctx, sx + 7, sy + 1, 2, 5, '#6e4324');
  px(ctx, sx + 4, sy + 1, 8, 2, '#6e4324');
}

function drawBin(ctx, sx, sy) {
  px(ctx, sx + 2, sy + 5, 12, 9, '#a56b3c');
  px(ctx, sx + 2, sy + 5, 12, 3, '#c4844e');
  px(ctx, sx + 6, sy + 2, 4, 4, PAL.gold);
  px(ctx, sx + 7, sy + 1, 2, 2, '#fffaf2');
}

function drawChest(ctx, sx, sy) {
  px(ctx, sx + 2, sy + 6, 12, 8, '#8d5a32');
  px(ctx, sx + 2, sy + 6, 12, 3, '#c4844e');
  px(ctx, sx + 7, sy + 9, 2, 2, PAL.gold);
}

function drawBed(ctx, sx, sy) {
  px(ctx, sx + 1, sy + 4, 14, 10, '#f4efe4');
  px(ctx, sx + 1, sy + 8, 14, 6, '#c4503a');
  px(ctx, sx + 2, sy + 5, 5, 3, '#fffaf2');
  px(ctx, sx + 1, sy + 3, 14, 2, '#6e4324');
}

function drawCounter(ctx, sx, sy) {
  px(ctx, sx, sy + 4, 16, 12, '#a56b3c');
  px(ctx, sx, sy + 4, 16, 3, '#c4844e');
  px(ctx, sx + 3, sy + 8, 4, 3, '#f6edd8');
  px(ctx, sx + 9, sy + 8, 4, 3, '#7fbf55');
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
