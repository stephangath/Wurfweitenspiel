import { useEffect, useState } from 'react';
import type { Direction } from '../types';
import { getColor } from '../logic/wheel';

export interface NumberInputProps {
  direction: Direction;
  onDirectionChange: (direction: Direction) => void;
  onSubmit: (number: number) => void;
  startNumber: number | null;
  onStartNumberChange: (n: number) => void;
  disabled: boolean;
}

const NUMBERS = Array.from({ length: 37 }, (_, i) => i);

export default function NumberInput({
  direction,
  onDirectionChange,
  onSubmit,
  startNumber,
  onStartNumberChange,
  disabled,
}: NumberInputProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [editingStart, setEditingStart] = useState(false);

  useEffect(() => {
    if (disabled) {
      setSelected(null);
      setEditingStart(false);
    }
  }, [disabled]);

  const handleNumpadClick = (n: number) => {
    if (editingStart) {
      onStartNumberChange(n);
      setEditingStart(false);
    } else {
      setSelected(n);
    }
  };

  const handleEintragen = () => {
    if (disabled || selected === null) return;
    onSubmit(selected);
    setSelected(null);
    setEditingStart(false);
  };

  return (
    <section className="section-card number-input">
      <h2 className="section-card__title">Eingabe</h2>

      <div className="number-input__meta">
        <div className="number-input__start-group">
          <span className="number-input__meta-label">Start</span>
          <button
            type="button"
            className={`number-input__start-chip${editingStart ? ' number-input__start-chip--editing' : ''}`}
            onClick={() => setEditingStart((v) => !v)}
            disabled={disabled}
            title="Startzahl ändern"
          >
            {startNumber !== null ? startNumber : '—'}
          </button>
          {editingStart && (
            <span className="number-input__start-hint">Zahl wählen...</span>
          )}
        </div>
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
        <div
          className={`numpad${editingStart ? ' numpad--editing-start' : ''}`}
          role="group"
          aria-label={editingStart ? 'Startzahl wählen' : 'Ergebnis-Zahl wählen'}
        >
          {NUMBERS.map((n) => {
            const color = getColor(n);
            const isSelected = !editingStart && selected === n;
            const isStart = editingStart && startNumber === n;
            return (
              <button
                key={n}
                type="button"
                className={`numpad__btn numpad__btn--${color}${isSelected ? ' numpad__btn--selected' : ''}${isStart ? ' numpad__btn--start-active' : ''}`}
                onClick={() => handleNumpadClick(n)}
                disabled={disabled}
                aria-pressed={isSelected || isStart}
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
          disabled={disabled || selected === null || editingStart}
        >
          Eintragen
        </button>
      </div>
    </section>
  );
}
