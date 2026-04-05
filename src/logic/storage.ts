import type { Croupier, Throw } from '../types';

const CROUPIERS_KEY = 'wurfweite_croupiers';
const THROWS_KEY = 'wurfweite_throws';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ---------------------------------------------------------------------------
// Croupier CRUD
// ---------------------------------------------------------------------------

export function loadCroupiers(): Croupier[] {
  return readJson<Croupier[]>(CROUPIERS_KEY, []);
}

export function saveCroupiers(croupiers: Croupier[]): void {
  writeJson(CROUPIERS_KEY, croupiers);
}

export function addCroupier(name: string): Croupier {
  const croupiers = loadCroupiers();
  const croupier: Croupier = {
    id: crypto.randomUUID(),
    name: name.trim(),
  };
  croupiers.push(croupier);
  saveCroupiers(croupiers);
  return croupier;
}

export function updateCroupier(id: string, name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const croupiers = loadCroupiers();
  const idx = croupiers.findIndex((c) => c.id === id);
  if (idx === -1) return;
  croupiers[idx] = { ...croupiers[idx], name: trimmed };
  saveCroupiers(croupiers);
}

export function removeCroupier(id: string): void {
  saveCroupiers(loadCroupiers().filter((c) => c.id !== id));
  saveThrows(loadThrows().filter((t) => t.croupierId !== id));
}

// ---------------------------------------------------------------------------
// Throw CRUD
// ---------------------------------------------------------------------------

export function loadThrows(): Throw[] {
  return readJson<Throw[]>(THROWS_KEY, []);
}

export function saveThrows(throws: Throw[]): void {
  writeJson(THROWS_KEY, throws);
}

export function addThrow(data: Omit<Throw, 'id' | 'timestamp'>): Throw {
  const throws = loadThrows();
  const entry: Throw = {
    ...data,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  throws.push(entry);
  saveThrows(throws);
  return entry;
}

export function getThrowsForCroupier(croupierId: string): Throw[] {
  return loadThrows().filter((t) => t.croupierId === croupierId);
}

export function removeThrow(id: string): void {
  saveThrows(loadThrows().filter((t) => t.id !== id));
}

export function clearThrowsForCroupier(croupierId: string): void {
  saveThrows(loadThrows().filter((t) => t.croupierId !== croupierId));
}

// ---------------------------------------------------------------------------
// Bulk export / import
// ---------------------------------------------------------------------------

export interface AppData {
  croupiers: Croupier[];
  throws: Throw[];
}

export function exportData(): AppData {
  return {
    croupiers: loadCroupiers(),
    throws: loadThrows(),
  };
}

export function importData(data: AppData): void {
  saveCroupiers(data.croupiers);
  saveThrows(data.throws);
}
