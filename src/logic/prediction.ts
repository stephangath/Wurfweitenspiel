import type { Throw, Direction } from '../types';
import { calcTargetNumbers } from './wurfweite';
import type { Verdict } from './confidence';
import {
  rayleighTest,
  binomialTailPValue,
  bonferroniAdjust,
  wilsonInterval,
  evaluateBet,
} from './confidence';

export interface ConfidenceInfo {
  pValue: number;
  hitRate: number;
  wilsonLo: number;
  wilsonHi: number;
  ev: number;
  verdict: Verdict;
}

export interface ModePrediction {
  wurfweite: number;
  frequency: number;
  targets: [number, number, number];
  confidence: ConfidenceInfo;
}

export interface CircularMeanPrediction {
  mean: number;          // continuous circular mean (0-11.999…)
  roundedMean: number;   // rounded to nearest integer Wurfweite (0-11)
  stdDev: number;        // circular standard deviation (scaled to 0-12 range)
  resultantLength: number; // R ∈ [0,1] — concentration measure
  targets: [number, number, number];
  confidence: ConfidenceInfo;
}

export interface Prediction {
  n: number;
  mode: ModePrediction | null;
  circularMean: CircularMeanPrediction | null;
}

const PERIOD = 12;
const TWO_PI = 2 * Math.PI;

/**
 * Compute the mode (most frequent Wurfweite).
 * Tie-break: lowest Wurfweite wins.
 */
export function computeMode(wurfweiten: number[]): { wurfweite: number; frequency: number } | null {
  if (wurfweiten.length === 0) return null;

  const counts = new Array<number>(PERIOD).fill(0);
  for (const w of wurfweiten) {
    counts[w]++;
  }

  let bestW = 0;
  let bestCount = 0;
  for (let w = 0; w < PERIOD; w++) {
    if (counts[w] > bestCount) {
      bestCount = counts[w];
      bestW = w;
    }
  }

  return { wurfweite: bestW, frequency: bestCount };
}

/**
 * Compute the circular mean and circular standard deviation of Wurfweite
 * values, treating them as points on a circle with period 12.
 *
 * - mean: atan2(S, C) * 12/(2π) mod 12
 * - stdDev: sqrt(-2·ln(R)) * 12/(2π)  where R = sqrt(C² + S²)
 */
export function computeCircularStats(
  wurfweiten: number[],
): { mean: number; roundedMean: number; stdDev: number; resultantLength: number } | null {
  if (wurfweiten.length === 0) return null;

  let sumCos = 0;
  let sumSin = 0;

  for (const w of wurfweiten) {
    const theta = (w * TWO_PI) / PERIOD;
    sumCos += Math.cos(theta);
    sumSin += Math.sin(theta);
  }

  const n = wurfweiten.length;
  const C = sumCos / n;
  const S = sumSin / n;
  const R = Math.sqrt(C * C + S * S);

  // Circular mean
  let meanAngle = Math.atan2(S, C);
  if (meanAngle < 0) meanAngle += TWO_PI;
  const mean = (meanAngle * PERIOD) / TWO_PI;

  const roundedMean = Math.round(mean) % PERIOD;

  // Circular standard deviation (only meaningful when R > 0)
  let stdDev = 0;
  if (R > 0 && R <= 1) {
    stdDev = (Math.sqrt(-2 * Math.log(R)) * PERIOD) / TWO_PI;
  }

  return { mean, roundedMean, stdDev, resultantLength: R };
}

/**
 * Extract valid Wurfweite values from a throw history.
 * Filters out null entries (first throw per session).
 */
function extractWurfweiten(throws: Throw[]): number[] {
  return throws
    .map((t) => t.wurfweite)
    .filter((w): w is number => w !== null);
}

/**
 * Produce a full prediction (mode + circular mean) for a croupier's throws.
 *
 * @param throws      All throws for one croupier, chronologically ordered
 * @param lastNumber  The most recent roulette number
 * @param nextDirection The anticipated next wheel direction
 */
export function predict(
  throws: Throw[],
  lastNumber: number,
  nextDirection: Direction,
): Prediction {
  const wurfweiten = extractWurfweiten(throws);

  if (wurfweiten.length === 0) {
    return { n: 0, mode: null, circularMean: null };
  }

  const modeResult = computeMode(wurfweiten);
  const circStats = computeCircularStats(wurfweiten);
  const n = wurfweiten.length;

  let mode: ModePrediction | null = null;
  if (modeResult) {
    const kMode = modeResult.frequency;
    const pHatMode = kMode / n;
    const binomRaw = binomialTailPValue(kMode, n, 1 / PERIOD);
    const pMode = bonferroniAdjust(binomRaw, PERIOD);
    const wMode = wilsonInterval(kMode, n);
    const evalMode = evaluateBet(pHatMode, wMode.lo, pMode, n);
    mode = {
      ...modeResult,
      targets: calcTargetNumbers(lastNumber, nextDirection, modeResult.wurfweite),
      confidence: {
        pValue: pMode,
        hitRate: pHatMode,
        wilsonLo: wMode.lo,
        wilsonHi: wMode.hi,
        ev: evalMode.ev,
        verdict: evalMode.verdict,
      },
    };
  }

  let circularMean: CircularMeanPrediction | null = null;
  if (circStats) {
    const kCirc = wurfweiten.filter((w) => w === circStats.roundedMean).length;
    const pHatCirc = kCirc / n;
    const { pValue: pRayleigh } = rayleighTest(circStats.resultantLength, n);
    const wCirc = wilsonInterval(kCirc, n);
    const evalCirc = evaluateBet(pHatCirc, wCirc.lo, pRayleigh, n);
    circularMean = {
      ...circStats,
      targets: calcTargetNumbers(lastNumber, nextDirection, circStats.roundedMean),
      confidence: {
        pValue: pRayleigh,
        hitRate: pHatCirc,
        wilsonLo: wCirc.lo,
        wilsonHi: wCirc.hi,
        ev: evalCirc.ev,
        verdict: evalCirc.verdict,
      },
    };
  }

  return { n, mode, circularMean };
}
