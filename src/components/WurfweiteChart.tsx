import { useMemo } from 'react';
import type { Throw, Direction } from '../types';

export interface WurfweiteChartProps {
  throws: Throw[];
  direction: Direction;
}

const PERIOD = 12;

const DIRECTION_META: Record<Direction, { glyph: string; label: string }> = {
  cw: { glyph: '↻', label: 'CW' },
  ccw: { glyph: '↺', label: 'CCW' },
};

export default function WurfweiteChart({ throws, direction }: WurfweiteChartProps) {
  const { counts, total } = useMemo(() => {
    const c = new Array<number>(PERIOD).fill(0);
    let n = 0;
    for (const t of throws) {
      if (t.direction !== direction) continue;
      if (t.wurfweite !== null) {
        c[t.wurfweite]++;
        n++;
      }
    }
    return { counts: c, total: n };
  }, [throws, direction]);

  const max = Math.max(1, ...counts);
  const meta = DIRECTION_META[direction];

  return (
    <section className="section-card wurfweite-chart" aria-labelledby="wurfweite-chart-title">
      <h2 className="section-card__title" id="wurfweite-chart-title">
        <span>Verteilung</span>
        <span
          className="wurfweite-chart__direction"
          title={`Nur Würfe in Kesselrichtung ${meta.label}`}
        >
          <span className="wurfweite-chart__direction-glyph" aria-hidden="true">
            {meta.glyph}
          </span>
          <span>{meta.label}</span>
          <span className="wurfweite-chart__direction-n">n = {total}</span>
        </span>
      </h2>
      <div
        className="wurfweite-chart__bars"
        role="group"
        aria-label={`Häufigkeit der Wurfweiten 0 bis 11 in Richtung ${meta.label}`}
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
