import { useMemo } from 'react';
import type { Throw } from '../types';

export interface WurfweiteChartProps {
  throws: Throw[];
}

const PERIOD = 12;

export default function WurfweiteChart({ throws }: WurfweiteChartProps) {
  const counts = useMemo(() => {
    const c = new Array<number>(PERIOD).fill(0);
    for (const t of throws) {
      if (t.wurfweite !== null) c[t.wurfweite]++;
    }
    return c;
  }, [throws]);

  const max = Math.max(1, ...counts);

  return (
    <section className="section-card wurfweite-chart" aria-labelledby="wurfweite-chart-title">
      <h2 className="section-card__title" id="wurfweite-chart-title">
        Verteilung
      </h2>
      <div
        className="wurfweite-chart__bars"
        role="group"
        aria-label="Häufigkeit der Wurfweiten 0 bis 11"
      >
        {counts.map((count, ww) => (
          <div className="ww-bar" key={ww}>
            <span className="ww-bar__label" aria-hidden="true">
              {ww}
            </span>
            <div className="ww-bar__track" aria-hidden="true">
              <div
                className="ww-bar__fill"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="ww-bar__count" aria-label={`Wurfweite ${ww}: ${count} mal`}>
              {count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
