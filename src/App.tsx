import { useState, useCallback } from 'react';
import type { Croupier, Throw, Direction } from './types';
import {
  loadCroupiers,
  addCroupier as storageAddCroupier,
  updateCroupier as storageUpdateCroupier,
  removeCroupier as storageRemoveCroupier,
  getThrowsForCroupier,
  addThrow as storageAddThrow,
  removeThrow as storageRemoveThrow,
  clearThrowsForCroupier,
  loadThrows,
  saveThrows,
} from './logic/storage';
import { calcWurfweite } from './logic/wurfweite';
import CroupierSelector from './components/CroupierSelector';
import NumberInput from './components/NumberInput';
import ThrowHistory from './components/ThrowHistory';
import WurfweiteChart from './components/WurfweiteChart';
import PredictionDisplay from './components/PredictionDisplay';

// ─── Helpers ──────────────────────────────────────────────────────

function inferNextDirection(throws: Throw[]): Direction {
  if (throws.length === 0) return 'cw';
  return throws[throws.length - 1].direction === 'cw' ? 'ccw' : 'cw';
}

/**
 * After deleting a throw from the middle of the sequence the wurfweite
 * chain can break.  This recalculates every wurfweite for the given
 * croupier's throws and persists the result.
 */
function recalculateAndPersist(croupierId: string): Throw[] {
  const all = loadThrows();
  const others = all.filter((t) => t.croupierId !== croupierId);
  const mine = all
    .filter((t) => t.croupierId === croupierId)
    .sort((a, b) => a.timestamp - b.timestamp);

  const recalculated = mine.map((t, i) => {
    if (i === 0) return { ...t, wurfweite: null };
    const prev = mine[i - 1];
    return { ...t, wurfweite: calcWurfweite(prev.number, t.number, t.direction) };
  });

  saveThrows([...others, ...recalculated]);
  return recalculated;
}

// ─── App ──────────────────────────────────────────────────────────

export default function App() {
  // ── Croupier state ────────────────────────────────────────────
  const [croupiers, setCroupiers] = useState<Croupier[]>(() => loadCroupiers());

  const [selectedCroupierId, setSelectedCroupierId] = useState<string | null>(
    () => {
      const loaded = loadCroupiers();
      return loaded.length > 0 ? loaded[0].id : null;
    },
  );

  // ── Throws for current croupier (sorted by timestamp) ─────────
  const [throws, setThrows] = useState<Throw[]>(() => {
    const loaded = loadCroupiers();
    if (loaded.length === 0) return [];
    return getThrowsForCroupier(loaded[0].id);
  });

  // ── Direction with auto-alternation ───────────────────────────
  const [nextDirection, setNextDirection] = useState<Direction>(() => {
    const loaded = loadCroupiers();
    if (loaded.length === 0) return 'cw';
    const t = getThrowsForCroupier(loaded[0].id);
    return inferNextDirection(t);
  });

  // ── Derived ───────────────────────────────────────────────────
  const lastNumber = throws.length > 0 ? throws[throws.length - 1].number : null;

  // ── Croupier CRUD ─────────────────────────────────────────────

  const handleSelectCroupier = useCallback((id: string) => {
    setSelectedCroupierId(id);
    const croupierThrows = getThrowsForCroupier(id);
    setThrows(croupierThrows);
    setNextDirection(inferNextDirection(croupierThrows));
  }, []);

  const handleAddCroupier = useCallback((name: string) => {
    const created = storageAddCroupier(name);
    setCroupiers(loadCroupiers());
    setSelectedCroupierId(created.id);
    setThrows([]);
    setNextDirection('cw');
  }, []);

  const handleRenameCroupier = useCallback((id: string, name: string) => {
    storageUpdateCroupier(id, name);
    setCroupiers(loadCroupiers());
  }, []);

  const handleRemoveCroupier = useCallback(
    (id: string) => {
      storageRemoveCroupier(id);
      const updated = loadCroupiers();
      setCroupiers(updated);

      if (selectedCroupierId === id) {
        const fallback = updated.length > 0 ? updated[0].id : null;
        setSelectedCroupierId(fallback);
        const fallbackThrows = fallback ? getThrowsForCroupier(fallback) : [];
        setThrows(fallbackThrows);
        setNextDirection(inferNextDirection(fallbackThrows));
      }
    },
    [selectedCroupierId],
  );

  // ── Throw recording ──────────────────────────────────────────

  const handleRecordThrow = useCallback(
    (number: number) => {
      if (!selectedCroupierId) return;

      const prevThrow = throws.length > 0 ? throws[throws.length - 1] : null;
      const wurfweite =
        prevThrow !== null
          ? calcWurfweite(prevThrow.number, number, nextDirection)
          : null;

      const entry = storageAddThrow({
        croupierId: selectedCroupierId,
        number,
        direction: nextDirection,
        wurfweite,
      });

      setThrows((prev) => [...prev, entry]);
      setNextDirection((d) => (d === 'cw' ? 'ccw' : 'cw'));
    },
    [selectedCroupierId, throws, nextDirection],
  );

  const handleRemoveThrow = useCallback(
    (id: string) => {
      if (!selectedCroupierId) return;
      storageRemoveThrow(id);
      const recalculated = recalculateAndPersist(selectedCroupierId);
      setThrows(recalculated);
      setNextDirection(inferNextDirection(recalculated));
    },
    [selectedCroupierId],
  );

  const handleClearThrows = useCallback(() => {
    if (!selectedCroupierId) return;
    clearThrowsForCroupier(selectedCroupierId);
    setThrows([]);
    setNextDirection('cw');
  }, [selectedCroupierId]);

  const handleDirectionChange = useCallback((d: Direction) => {
    setNextDirection(d);
  }, []);

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Wurfweitenspiel</h1>
      </header>

      <main className="app__main">
        <CroupierSelector
          croupiers={croupiers}
          selectedId={selectedCroupierId}
          onSelect={handleSelectCroupier}
          onAdd={handleAddCroupier}
          onRename={handleRenameCroupier}
          onRemove={handleRemoveCroupier}
        />

        <PredictionDisplay
          throws={throws}
          lastNumber={lastNumber}
          nextDirection={nextDirection}
        />

        <NumberInput
          direction={nextDirection}
          onDirectionChange={handleDirectionChange}
          onSubmit={handleRecordThrow}
          lastNumber={lastNumber}
          disabled={!selectedCroupierId}
        />

        <div className="app__bottom">
          <ThrowHistory
            throws={throws}
            onRemove={handleRemoveThrow}
            onClear={handleClearThrows}
          />
          <WurfweiteChart throws={throws} />
        </div>
      </main>
    </div>
  );
}
