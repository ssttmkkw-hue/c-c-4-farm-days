function blank(w, h, ch) {
  const g = [];
  for (let y = 0; y < h; y++) g.push(Array.from({ length: w }, () => ch));
  return g;
}

function border(g, ch) {
  const h = g.length;
  const w = g[0].length;
  for (let x = 0; x < w; x++) {
    g[0][x] = ch;
    g[h - 1][x] = ch;
  }
  for (let y = 0; y < h; y++) {
    g[y][0] = ch;
    g[y][w - 1] = ch;
  }
}

function fill(g, x, y, w, h, ch) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) g[y + j][x + i] = ch;
  }
}

function fence(g, x, y, w, h) {
  for (let i = 0; i < w; i++) {
    g[y][x + i] = '=';
    g[y + h - 1][x + i] = '=';
  }
  for (let j = 0; j < h; j++) {
    g[y + j][x] = '=';
    g[y + j][x + w - 1] = '=';
  }
}

function buildFarm() {
  const g = blank(32, 20, '.');
  border(g, 'T');
  fill(g, 3, 2, 6, 4, 'H');
  g[5][6] = 'D';
  fence(g, 3, 7, 6, 4);
  fill(g, 4, 8, 4, 2, '.');
  g[10][5] = 'g';
  g[10][6] = 'g';
  // Cow pen sits beside the lane so the barn is in the first view from the door.
  fence(g, 12, 8, 8, 5);
  g[10][12] = 'g';
  g[11][12] = 'g';
  fill(g, 23, 7, 8, 6, 's');
  g[4][15] = 'w';
  g[16][4] = 'c';
  g[7][19] = 'X';
  fill(g, 13, 16, 5, 2, '~');
  g[8][22] = 'T';
  g[11][20] = 'T';
  g[6][28] = 'f';
  g[17][11] = 'f';
  for (let x = 9; x <= 22; x++) g[6][x] = ',';
  for (let y = 7; y <= 17; y++) if (g[y][10] === '.') g[y][10] = ',';
  for (let x = 8; x <= 30; x++) if (g[18][x] === '.' || g[18][x] === ',') g[18][x] = ',';
  return g;
}

function buildVillage() {
  const g = blank(32, 20, '.');
  border(g, 'T');
  fill(g, 2, 2, 6, 4, 'H');
  g[5][4] = 'D';
  fill(g, 23, 2, 6, 4, 'H');
  g[5][25] = 'D';
  fill(g, 12, 7, 8, 4, 'H');
  g[10][15] = 'D';
  g[12][6] = 'P';
  fence(g, 18, 12, 5, 3);
  fill(g, 19, 13, 3, 1, '.');
  g[14][20] = 'g';
  g[8][3] = 'T';
  g[8][29] = 'T';
  g[14][3] = 'f';
  for (let x = 1; x <= 30; x++) {
    if (g[16][x] === '.') g[16][x] = ',';
  }
  for (let y = 11; y <= 15; y++) {
    if (g[y][15] === '.') g[y][15] = ',';
  }
  for (let x = 4; x <= 8; x++) if (g[6][x] === '.') g[6][x] = ',';
  for (let x = 21; x <= 26; x++) if (g[6][x] === '.') g[6][x] = ',';
  return g;
}

function buildPath() {
  const g = blank(18, 10, '.');
  border(g, 'T');
  for (let x = 1; x <= 16; x++) g[5][x] = ',';
  g[3][4] = 'f';
  g[3][9] = 'f';
  g[3][14] = 'f';
  g[7][6] = 'f';
  g[7][12] = 'f';
  g[2][7] = 'T';
  g[8][11] = 'T';
  return g;
}

function rug(list, x, y, w, h) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) list.push({ x: x + i, y: y + j, kind: 'rug' });
  }
}

function buildHouse() {
  const g = blank(22, 16, 'F');
  border(g, '#');
  g[3][3] = 'B';
  g[3][4] = 'B';
  g[4][3] = 'B';
  g[4][4] = 'B';
  g[15][10] = 'D';
  g[15][11] = 'D';
  return g;
}

function houseDecor() {
  const d = [];
  rug(d, 8, 7, 5, 3);
  d.push({ x: 16, y: 4, kind: 'table' });
  d.push({ x: 18, y: 4, kind: 'plant' });
  d.push({ x: 16, y: 10, kind: 'shelf' });
  d.push({ x: 6, y: 6, kind: 'lamp' });
  d.push({ x: 17, y: 8, kind: 'plant' });
  d.push({ x: 5, y: 0, kind: 'window' });
  d.push({ x: 16, y: 0, kind: 'window' });
  d.push({ x: 0, y: 8, kind: 'window' });
  d.push({ x: 21, y: 8, kind: 'window' });
  d.push({ x: 10, y: 13, kind: 'mat' });
  d.push({ x: 11, y: 13, kind: 'mat' });
  return d;
}

function buildShop() {
  const g = blank(22, 16, 'F');
  border(g, '#');
  fill(g, 3, 3, 10, 1, 'k');
  g[15][10] = 'D';
  g[15][11] = 'D';
  return g;
}

function shopDecor() {
  const d = [];
  rug(d, 7, 8, 6, 3);
  d.push({ x: 16, y: 5, kind: 'shelf' });
  d.push({ x: 17, y: 5, kind: 'shelf' });
  d.push({ x: 18, y: 8, kind: 'crate' });
  d.push({ x: 18, y: 10, kind: 'crate' });
  d.push({ x: 4, y: 6, kind: 'plant' });
  d.push({ x: 18, y: 12, kind: 'plant' });
  d.push({ x: 6, y: 7, kind: 'lamp' });
  d.push({ x: 5, y: 0, kind: 'window' });
  d.push({ x: 16, y: 0, kind: 'window' });
  d.push({ x: 0, y: 6, kind: 'window' });
  d.push({ x: 21, y: 6, kind: 'window' });
  d.push({ x: 10, y: 13, kind: 'mat' });
  d.push({ x: 11, y: 13, kind: 'mat' });
  return d;
}

function pack(id, grid, links, spawn, decor) {
  return {
    id,
    w: grid[0].length,
    h: grid.length,
    tiles: grid,
    links,
    spawn,
    decor: decor || [],
  };
}

export const MAPS = {
  farm: pack('farm', buildFarm(), [
    { x: 6, y: 5, to: 'house', sx: 10, sy: 12, dir: 'up' },
    { x: 30, y: 18, to: 'path', sx: 2, sy: 5, dir: 'right' },
  ], { x: 6, y: 6, dir: 'down' }),
  village: pack('village', buildVillage(), [
    { x: 1, y: 16, to: 'path', sx: 14, sy: 5, dir: 'left' },
    { x: 15, y: 10, to: 'shop', sx: 10, sy: 12, dir: 'up' },
  ], { x: 15, y: 12, dir: 'up' }),
  path: pack('path', buildPath(), [
    { x: 1, y: 5, to: 'farm', sx: 28, sy: 18, dir: 'left' },
    { x: 16, y: 5, to: 'village', sx: 3, sy: 16, dir: 'right' },
  ], { x: 8, y: 5, dir: 'down' }),
  house: pack('house', buildHouse(), [
    { x: 10, y: 15, to: 'farm', sx: 6, sy: 6, dir: 'down' },
    { x: 11, y: 15, to: 'farm', sx: 6, sy: 6, dir: 'down' },
  ], { x: 10, y: 12, dir: 'up' }, houseDecor()),
  shop: pack('shop', buildShop(), [
    { x: 10, y: 15, to: 'village', sx: 15, sy: 11, dir: 'down' },
    { x: 11, y: 15, to: 'village', sx: 15, sy: 11, dir: 'down' },
  ], { x: 10, y: 12, dir: 'up' }, shopDecor()),
};

export function getMap(id) {
  return MAPS[id] || MAPS.farm;
}

export function farmPlots() {
  const map = MAPS.farm;
  const list = [];
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (map.tiles[y][x] === 's') list.push({ x, y });
    }
  }
  return list;
}

export function findLink(map, x, y) {
  return map.links.find((l) => l.x === x && l.y === y) || null;
}
