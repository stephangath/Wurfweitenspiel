/**
 * European roulette wheel layout and position utilities.
 *
 * The wheel sequence is clockwise starting from 0.
 * 37 pockets total (0–36).
 */

export const WHEEL_SEQUENCE: readonly number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

export const WHEEL_SIZE = WHEEL_SEQUENCE.length; // 37

const numberToPosition = new Map<number, number>();
WHEEL_SEQUENCE.forEach((num, idx) => numberToPosition.set(num, idx));

/** Get the clockwise position index (0-36) of a roulette number. */
export function getPosition(rouletteNumber: number): number {
  const pos = numberToPosition.get(rouletteNumber);
  if (pos === undefined) {
    throw new RangeError(`Invalid roulette number: ${rouletteNumber}`);
  }
  return pos;
}

/** Get the roulette number at a given clockwise position index (mod 37). */
export function getNumber(position: number): number {
  const normalized = ((position % WHEEL_SIZE) + WHEEL_SIZE) % WHEEL_SIZE;
  return WHEEL_SEQUENCE[normalized];
}

/** Red numbers on a European wheel. */
export const RED_NUMBERS: ReadonlySet<number> = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

/** Determine the colour of a roulette number. */
export function getColor(rouletteNumber: number): 'red' | 'black' | 'green' {
  if (rouletteNumber === 0) return 'green';
  return RED_NUMBERS.has(rouletteNumber) ? 'red' : 'black';
}
