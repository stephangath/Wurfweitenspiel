import type { Throw } from '../types';
import { getColor } from '../logic/wheel';
import './PredictionDisplay.css';

export interface ThrowHistoryProps {
  throws: Throw[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function ThrowHistory({
  throws,
  onRemove,
  onClear,
}: ThrowHistoryProps) {
  const reversed = [...throws].reverse();

  return (
    <section className="section-card throw-history">
      <h2 className="section-card__title">Verlauf</h2>

      {throws.length > 0 && (
        <div className="throw-history__actions">
          <button
            className="throw-history__clear"
            onClick={() => {
              if (confirm('Alle Würfe löschen?')) onClear();
            }}
          >
            Alle löschen
          </button>
        </div>
      )}

      {throws.length === 0 ? (
        <p className="throw-history__empty">Noch keine Würfe.</p>
      ) : (
        <div className="throw-history__scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Zahl</th>
                <th scope="col" title="Kesselrichtung">
                  Ri.
                </th>
                <th scope="col" title="Wurfweite">
                  WW
                </th>
                <th scope="col">
                  <span className="visually-hidden">Aktion</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {reversed.map((t, i) => {
                const color = getColor(t.number);
                const rowNum = throws.length - i;
                return (
                  <tr key={t.id}>
                    <td>{rowNum}</td>
                    <td>
                      <span className={`roulette-number roulette-number--${color}`}>
                        {t.number}
                      </span>
                    </td>
                    <td aria-label={t.direction === 'cw' ? 'Uhrzeigersinn' : 'Gegen Uhrzeigersinn'}>
                      {t.direction === 'cw' ? '↻' : '↺'}
                    </td>
                    <td className="throw-history__ww">
                      {t.wurfweite !== null ? t.wurfweite : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="throw-history__remove"
                        onClick={() => onRemove(t.id)}
                        title="Wurf entfernen"
                        aria-label={`Wurf ${rowNum} entfernen`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
