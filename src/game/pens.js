/** Coop and barn bounds. Wander and save migration both use these. */
export const PEN = {
  chicken: { x0: 4.05, y0: 8.05, x1: 7.75, y1: 9.72 },
  cow: { x0: 13.2, y0: 9.25, x1: 17.7, y1: 11.15 },
};

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function penFor(animal) {
  return animal && animal.type === 'cow' ? PEN.cow : PEN.chicken;
}

export function clampAnimal(animal) {
  const pen = penFor(animal);
  const x = Number(animal.x);
  const y = Number(animal.y);
  animal.x = clamp(Number.isFinite(x) ? x : (pen.x0 + pen.x1) / 2, pen.x0, pen.x1);
  animal.y = clamp(Number.isFinite(y) ? y : (pen.y0 + pen.y1) / 2, pen.y0, pen.y1);
  return animal;
}
