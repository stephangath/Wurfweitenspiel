import { useEffect, useRef, useState } from 'react';
import type { Croupier } from '../types';

export interface CroupierSelectorProps {
  croupiers: Croupier[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export default function CroupierSelector({
  croupiers,
  selectedId,
  onSelect,
  onAdd,
  onRename,
  onRemove,
}: CroupierSelectorProps) {
  const addDialogRef = useRef<HTMLDialogElement>(null);
  const manageDialogRef = useRef<HTMLDialogElement>(null);

  const [addName, setAddName] = useState('');
  const [draftNames, setDraftNames] = useState<Record<string, string>>({});

  const openAddDialog = () => {
    setAddName('');
    queueMicrotask(() => addDialogRef.current?.showModal());
  };

  const closeAddDialog = () => {
    addDialogRef.current?.close();
    setAddName('');
  };

  const submitAdd = () => {
    const trimmed = addName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    closeAddDialog();
  };

  const openManageDialog = () => {
    const next: Record<string, string> = {};
    for (const c of croupiers) next[c.id] = c.name;
    setDraftNames(next);
    queueMicrotask(() => manageDialogRef.current?.showModal());
  };

  const closeManageDialog = () => {
    manageDialogRef.current?.close();
  };

  const handleRenameBlur = (id: string, original: string) => {
    const next = (draftNames[id] ?? '').trim();
    if (!next) {
      setDraftNames((prev) => ({ ...prev, [id]: original }));
      return;
    }
    if (next === original) return;
    onRename(id, next);
  };

  const handleRemoveInManage = (id: string, name: string) => {
    if (!confirm(`„${name}“ und alle Würfe löschen?`)) return;
    onRemove(id);
    setDraftNames((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Keep draft in sync when parent list changes while manage dialog is open
  useEffect(() => {
    if (!manageDialogRef.current?.open) return;
    setDraftNames((prev) => {
      const next = { ...prev };
      for (const c of croupiers) {
        if (!(c.id in next)) next[c.id] = c.name;
      }
      for (const id of Object.keys(next)) {
        if (!croupiers.some((c) => c.id === id)) delete next[id];
      }
      return next;
    });
  }, [croupiers]);

  return (
    <div className="croupier-selector">
      <label className="croupier-selector__label" htmlFor="croupier-select">
        Croupier
      </label>
      <div className="croupier-selector__row">
        <select
          id="croupier-select"
          className="croupier-selector__select"
          value={selectedId ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          disabled={croupiers.length === 0}
        >
          {croupiers.length === 0 && (
            <option value="">— Kein Croupier —</option>
          )}
          {croupiers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="button" className="croupier-selector__btn" onClick={openAddDialog}>
          + Neu
        </button>
        <button
          type="button"
          className="croupier-selector__btn croupier-selector__btn--icon"
          onClick={openManageDialog}
          disabled={croupiers.length === 0}
          title="Croupiers verwalten"
          aria-label="Croupiers verwalten"
        >
          ⚙
        </button>
        {selectedId && (
          <button
            type="button"
            className="croupier-selector__btn croupier-selector__btn--danger"
            onClick={() => {
              const c = croupiers.find((x) => x.id === selectedId);
              if (
                c &&
                confirm(`„${c.name}“ und alle Würfe löschen?`)
              ) {
                onRemove(selectedId);
              }
            }}
            title="Aktuellen Croupier löschen"
            aria-label="Aktuellen Croupier löschen"
          >
            ✕
          </button>
        )}
      </div>

      <dialog
        ref={addDialogRef}
        className="croupier-dialog"
        onCancel={(e) => {
          e.preventDefault();
          closeAddDialog();
        }}
      >
        <form
          className="croupier-dialog__panel"
          onSubmit={(e) => {
            e.preventDefault();
            submitAdd();
          }}
        >
          <h2 className="croupier-dialog__title" id="add-croupier-title">
            Neuer Croupier
          </h2>
          <input
            className="croupier-dialog__input"
            autoFocus
            aria-labelledby="add-croupier-title"
            placeholder="Name"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeAddDialog();
            }}
          />
          <div className="croupier-dialog__actions">
            <button type="button" className="croupier-dialog__btn croupier-dialog__btn--ghost" onClick={closeAddDialog}>
              Abbrechen
            </button>
            <button type="submit" className="croupier-dialog__btn croupier-dialog__btn--primary" disabled={!addName.trim()}>
              Anlegen
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={manageDialogRef}
        className="croupier-dialog"
        onCancel={(e) => {
          e.preventDefault();
          closeManageDialog();
        }}
      >
        <div className="croupier-dialog__panel">
          <h2 className="croupier-dialog__title" id="manage-croupier-title">
            Croupiers verwalten
          </h2>
          {croupiers.length === 0 ? (
            <p className="croupier-dialog__empty">Keine Croupiers angelegt.</p>
          ) : (
            <ul className="croupier-manage-list" aria-labelledby="manage-croupier-title">
              {croupiers.map((c) => (
                <li key={c.id} className="croupier-manage-list__item">
                  <input
                    className="croupier-dialog__input croupier-manage-list__name"
                    value={draftNames[c.id] ?? c.name}
                    onChange={(e) =>
                      setDraftNames((prev) => ({ ...prev, [c.id]: e.target.value }))
                    }
                    onBlur={() => handleRenameBlur(c.id, c.name)}
                    aria-label={`Name ${c.name}`}
                  />
                  <button
                    type="button"
                    className="croupier-manage-list__remove"
                    onClick={() => handleRemoveInManage(c.id, draftNames[c.id] ?? c.name)}
                    aria-label={`${draftNames[c.id] ?? c.name} löschen`}
                  >
                    Löschen
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="croupier-dialog__actions">
            <button type="button" className="croupier-dialog__btn croupier-dialog__btn--primary" onClick={closeManageDialog}>
              Fertig
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
