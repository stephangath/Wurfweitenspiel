import type { Direction } from '../types';
import { getPosition, getNumber, WHEEL_SIZE } from './wheel';

/**
 * Calculate the raw distance (in pockets) the ball travelled from prevNumber
 * to currNumber given the wheel spin direction.
 *
 * The ball always runs *opposite* to the wheel direction:
 *   - Wheel CW  → ball CCW → distance = (prevPos - currPos + 37) % 37
 *   - Wheel CCW → ball CW  → distance = (currPos - prevPos + 37) % 37
 */
export function calcDistance(
  prevNumber: number,
  currNumber: number,
  direction: Direction,
): number {
  const prevPos = getPosition(prevNumber);
  const currPos = getPosition(currNumber);

  if (direction === 'cw') {
    return (prevPos - currPos + WHEEL_SIZE) % WHEEL_SIZE;
  }
  return (currPos - prevPos + WHEEL_SIZE) % WHEEL_SIZE;
}

/** Convert a pocket distance to a Wurfweite value (0-11). */
export function distanceToWurfweite(distance: number): number {
  return Math.floor(distance / 3) % 12;
}

/**
 * Calculate the Wurfweite (throw distance category 0-11) between two
 * consecutive numbers given the wheel direction.
 *
 * Returns null when prevNumber and currNumber are the same pocket
 * (distance 0 → Wurfweite 0 is still valid, so we don't null that out).
 */
export function calcWurfweite(
  prevNumber: number,
  currNumber: number,
  direction: Direction,
): number {
  const dist = calcDistance(prevNumber, currNumber, direction);
  return distanceToWurfweite(dist);
}

/**
 * Given the last roulette number, the *next* wheel direction, and a predicted
 * Wurfweite, compute the 3 target numbers the ball is expected to land on.
 *
 * The 3 target pockets correspond to positions w*3, w*3+1, w*3+2 in the
 * ball's travel direction from the last number's position.
 */
export function calcTargetNumbers(
  lastNumber: number,
  nextDirection: Direction,
  predictedWurfweite: number,
): [number, number, number] {
  const lastPos = getPosition(lastNumber);
  const baseOffset = predictedWurfweite * 3;

  const targets: [number, number, number] = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    const offset = baseOffset + i;
    let targetPos: number;

    if (nextDirection === 'cw') {
      // Ball travels CCW → subtract offset
      targetPos = lastPos - offset;
    } else {
      // Ball travels CW → add offset
      targetPos = lastPos + offset;
    }

    targets[i] = getNumber(targetPos);
  }

  return targets;
}
