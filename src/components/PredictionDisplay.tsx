import { useMemo } from 'react';
import type { Throw, Direction } from '../types';
import { predict } from '../logic/prediction';
import type { Prediction } from '../logic/prediction';
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
      )}

      {prediction?.circularMean && (
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
      )}
    </section>
  );
}
