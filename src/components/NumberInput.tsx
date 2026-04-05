import { useEffect, useState } from 'react';
import type { Direction } from '../types';
import { getColor } from '../logic/wheel';

export interface NumberInputProps {
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  onSubmit: (number: number) => void;
  lastNumber: number | null;
  disabled: boolean;
}

const NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36

export default function NumberInput({
  direction,
  onDirectionChange,
  onSubmit,
  lastNumber,
  disabled,
}: NumberInputProps) {
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (disabled) setSelected(null);
  }, [disabled]);

  const handleEintragen = () => {
    if (disabled || selected === null) return;
    onSubmit(selected);
    setSelected(null);
  };

  return (
    <section className="section-card number-input">
      <h2 className="section-card__title">Eingabe</h2>

      <div className="number-input__meta">
        <p className="number-input__letzte">
          <span className="number-input__meta-label">Letzte</span>
          <span className="number-input__meta-value" aria-live="polite">
            {lastNumber !== null ? lastNumber : '—'}
          </span>
        </p>
        <div className="number-input__direction" role="group" aria-label="Kesselrichtung">
          <button
            type="button"
            className={`dir-btn ${direction === 'cw' ? 'dir-btn--active' : ''}`}
            onClick={() => onDirectionChange('cw')}
            disabled={disabled}
          >
            ↻ CW
          </button>
          <button
            type="button"
            className={`dir-btn ${direction === 'ccw' ? 'dir-btn--active' : ''}`}
            onClick={() => onDirectionChange('ccw')}
            disabled={disabled}
          >
            ↺ CCW
          </button>
        </div>
      </div>

      <div className="number-input__numpad-row">
        <div className="numpad" role="group" aria-label="Roulette-Zahl wählen">
          {NUMBERS.map((n) => {
            const color = getColor(n);
            const isSelected = selected === n;
            return (
              <button
                key={n}
                type="button"
                className={`numpad__btn numpad__btn--${color}${isSelected ? ' numpad__btn--selected' : ''}`}
                onClick={() => setSelected(n)}
                disabled={disabled}
                aria-pressed={isSelected}
              >
                {n}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="number-input__submit"
          onClick={handleEintragen}
          disabled={disabled || selected === null}
        >
          Eintragen
        </button>
      </div>
    </section>
  );
}
