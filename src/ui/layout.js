/** Landscape phones put the pad in the side gutters. Keep this in sync with body.touch-sides. */
export function sideTouchLayout(width, height) {
  return width >= 560 && height <= 520;
}

/**
 * Pixels to keep clear under the canvas.
 * Side touch is position:fixed, so it must not shrink the farm.
 */
export function canvasReserve({ playing, hud = 0, hotbar = 0, touch = 0, sideTouch = false }) {
  if (!playing) return 24;
  return 24 + hud + hotbar + (sideTouch ? 0 : touch);
}
