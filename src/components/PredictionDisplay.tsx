import { useMemo } from 'react';
import type { Throw, Direction } from '../types';
import { predict } from '../logic/prediction';
import type { Prediction, ConfidenceInfo } from '../logic/prediction';
import { getColor } from '../logic/wheel';
import './PredictionDisplay.css';

export interface PredictionDisplayProps {
  throws: Throw[];
  lastNumber: number | null;
  nextDirection: Direction;
}

function RouletteNumber({ value }: { value: number }) {
  const color = getColor(value);
  return (
    <span className={`roulette-number roulette-number--${color}`}>
      {value}
    </span>
  );
}

function TargetNumbers({ targets }: { targets: [number, number, number] }) {
  return (
    <span className="target-numbers">
      <span className="target-arrow">→</span>
      {targets.map((n, i) => (
        <span key={i}>
          {i > 0 && <span className="target-sep">,&thinsp;</span>}
          <RouletteNumber value={n} />
        </span>
      ))}
    </span>
  );
}

function formatPExact(p: number): string {
  if (p <= 0) return '0';
  if (p >= 1) return '1';
  if (p < 0.0001) return p.toExponential(3);
  return p.toFixed(4);
}

function significanceStars(p: number): string {
  if (p < 0.01) return '***';
  if (p < 0.05) return '**';
  if (p < 0.1) return '*';
  return 'n.s.';
}

function verdictLabel(verdict: ConfidenceInfo['verdict']): string {
  switch (verdict) {
    case 'green':
      return 'lohnt sich';
    case 'yellow':
      return 'grenzwertig';
    case 'red':
      return 'zu riskant';
    default:
      return 'zu wenig Daten';
  }
}

function betLightClass(verdict: ConfidenceInfo['verdict']): string {
  switch (verdict) {
    case 'green':
      return 'bet-light bet-light--green';
    case 'yellow':
      return 'bet-light bet-light--yellow';
    case 'red':
      return 'bet-light bet-light--red';
    default:
      return 'bet-light bet-light--none';
  }
}

function formatEvLine(ev: number): string {
  const pct = Math.round(ev * 100);
  const sign = pct > 0 ? '+' : '';
  return `EV ${sign}${pct} % / Chip`;
}

function ConfidenceStrip({ c }: { c: ConfidenceInfo }) {
  const wilsonTooltip = `Wilson 95 %: [${(c.wilsonLo * 100).toFixed(1)} %, ${(c.wilsonHi * 100).toFixed(1)} %]`;
  const pTooltip = `p = ${formatPExact(c.pValue)}`;
  return (
    <div className="prediction-confidence">
      <span className="sig-badge" title={pTooltip}>
        {significanceStars(c.pValue)}
      </span>
      <span className="prediction-confidence__bet" title={verdictLabel(c.verdict)}>
        <span className={betLightClass(c.verdict)} aria-hidden="true">
          ●
        </span>
        <span className="bet-light-label">{verdictLabel(c.verdict)}</span>
      </span>
      <span className="ev-value" title={wilsonTooltip}>
        {formatEvLine(c.ev)}
      </span>
    </div>
  );
}

export default function PredictionDisplay({
  throws,
  lastNumber,
  nextDirection,
}: PredictionDisplayProps) {
  const prediction: Prediction | null = useMemo(() => {
    if (lastNumber === null || throws.length === 0) return null;
    return predict(throws, lastNumber, nextDirection);
  }, [throws, lastNumber, nextDirection]);

  const hasData =
    prediction !== null &&
    (prediction.mode !== null || prediction.circularMean !== null);

  return (
    <section className="prediction-display">
      <h2 className="prediction-display__title">Prognose</h2>

      {!hasData && (
        <p className="prediction-display__empty">
          Noch keine Wurfweiten&thinsp;—&thinsp;mindestens 2 Würfe nötig.
        </p>
      )}

      {prediction?.mode && (
        <div className="prediction-block">
          <div className="prediction-row prediction-row--mode">
            <span className="prediction-label">Modus</span>
            <span className="prediction-value">
              <span className="wurfweite-badge">
                WW {prediction.mode.wurfweite}
              </span>
              <span className="prediction-freq">
                ({prediction.mode.frequency}×)
              </span>
            </span>
            <TargetNumbers targets={prediction.mode.targets} />
          </div>
          <ConfidenceStrip c={prediction.mode.confidence} />
        </div>
      )}

      {prediction?.circularMean && (
        <div className="prediction-block">
          <div className="prediction-row prediction-row--circular">
            <span className="prediction-label">Schnitt</span>
            <span className="prediction-value">
              <span className="wurfweite-badge">
                WW {prediction.circularMean.mean.toFixed(1)}
              </span>
              <span className="prediction-dev">
                (±{prediction.circularMean.stdDev.toFixed(1)})
              </span>
            </span>
            <TargetNumbers targets={prediction.circularMean.targets} />
          </div>
          <ConfidenceStrip c={prediction.circularMean.confidence} />
        </div>
      )}
    </section>
  );
}
