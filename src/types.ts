export interface Croupier {
  id: string;
  name: string;
}

export interface Throw {
  id: string;
  croupierId: string;
  number: number;          // 0-36
  direction: 'cw' | 'ccw'; // Kesselrichtung
  wurfweite: number | null; // 0-11, null beim ersten Wurf
  timestamp: number;
}

export type Direction = 'cw' | 'ccw';
