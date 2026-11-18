export const TILE = 16;
export const VIEW_W = 320;
export const VIEW_H = 224;

/** Tiles the farmer cannot walk through. */
export const SOLID = new Set(['T', '#', '~', '=', 'H', 'w', 'X', 'c', 'B', 'k', 'P']);

export function inBounds(map, x, y) {
  return x >= 0 && y >= 0 && x < map.w && y < map.h;
}

export function tileAt(map, x, y) {
  if (!inBounds(map, x, y)) return '#';
  return map.tiles[y][x];
}

export function isSolid(map, x, y) {
  return SOLID.has(tileAt(map, x, y));
}

export function bodyBlocked(map, x, y) {
  const x0 = x + 0.16;
  const y0 = y + 0.22;
  const x1 = x + 0.84;
  const y1 = y + 0.94;
  const pts = [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1],
  ];
  for (const [px, py] of pts) {
    if (isSolid(map, Math.floor(px), Math.floor(py))) return true;
  }
  return false;
}
