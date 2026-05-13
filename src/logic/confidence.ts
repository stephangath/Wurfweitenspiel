/** Break-even hit rate for the 3-number / Wurfweite framing: EV = 12·p − 1. */
export const BREAK_EVEN_HIT_RATE = 1 / 12;

const Z95 = 1.96;

/**
 * Rayleigh test on circular uniformity: Z = n·R², large-sample p-value with
 * first-order correction (plan formula).
 */
export function rayleighTest(R: number, n: number): { z: number; pValue: number } {
  if (n <= 0 || R < 0 || R > 1) {
    return { z: 0, pValue: 1 };
  }
  const z = n * R * R;
  if (z === 0) {
    return { z: 0, pValue: 1 };
  }
  const correction = 1 + (2 * z - z * z) / (4 * n);
  const pRaw = Math.exp(-z) * Math.max(0, correction);
  return { z, pValue: Math.min(1, Math.max(0, pRaw)) };
}

/** Binomial PMF P(X = k) for X ~ Bin(n, p0). */
function binomialPmf(n: number, k: number, p0: number): number {
  if (k < 0 || k > n) return 0;
  if (p0 <= 0) return k === 0 ? 1 : 0;
  if (p0 >= 1) return k === n ? 1 : 0;
  // log PMF for stability at tails
  let logP = 0;
  for (let j = 0; j < k; j++) {
    logP += Math.log(n - j) - Math.log(j + 1);
  }
  logP += k * Math.log(p0) + (n - k) * Math.log(1 - p0);
  return Math.exp(logP);
}

/** One-sided P(X >= k | n, p0). */
export function binomialTailPValue(k: number, n: number, p0: number): number {
  if (n <= 0) return 1;
  if (k <= 0) return 1;
  if (k > n) return 0;
  let pmf = binomialPmf(n, k, p0);
  let sum = pmf;
  const ratio = (i: number) => ((n - i) / (i + 1)) * (p0 / (1 - p0));
  for (let i = k; i < n; i++) {
    pmf *= ratio(i);
    sum += pmf;
    if (sum >= 1 - 1e-15) return 1;
  }
  return Math.min(1, sum);
}

export function bonferroniAdjust(p: number, m: number): number {
  if (m <= 0) return p;
  return Math.min(1, p * m);
}

/**
 * Wilson score interval for binomial proportion (k successes in n trials).
 */
export function wilsonInterval(
  k: number,
  n: number,
  z: number = Z95,
): { lo: number; hi: number } {
  if (n <= 0) {
    return { lo: 0, hi: 1 };
  }
  const kk = Math.min(n, Math.max(0, k));
  const pHat = kk / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const center = (pHat + z2 / (2 * n)) / denom;
  const inner = (pHat * (1 - pHat)) / n + z2 / (4 * n * n);
  const half = (z * Math.sqrt(Math.max(0, inner))) / denom;
  return {
    lo: Math.max(0, center - half),
    hi: Math.min(1, center + half),
  };
}

export type Verdict = 'red' | 'yellow' | 'green' | 'insufficient';

export interface BetEvaluation {
  verdict: Verdict;
  ev: number;
}

/**
 * Ampel: insufficient if n < 12; green if p < 0.05 and Wilson lower > 1/12;
 * yellow if p < 0.10 or (p̂ > 1/12 and n >= 12); else red.
 */
export function evaluateBet(
  pHat: number,
  wilsonLo: number,
  pValue: number,
  n: number,
): BetEvaluation {
  const ev = 12 * pHat - 1;
  if (n < 12) {
    return { verdict: 'insufficient', ev };
  }
  const green = pValue < 0.05 && wilsonLo > BREAK_EVEN_HIT_RATE;
  if (green) {
    return { verdict: 'green', ev };
  }
  const yellow = pValue < 0.1 || pHat > BREAK_EVEN_HIT_RATE;
  if (yellow) {
    return { verdict: 'yellow', ev };
  }
  return { verdict: 'red', ev };
}
