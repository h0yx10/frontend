export type OrbitTone = 'plan' | 'coordinate' | 'followup';

export interface OrbitPhase {
  id: string;
  tone: OrbitTone;
  radius: number;
  speed: number;
  items: readonly { id: string; label: string }[];
}

export interface OrbitProjection {
  /** Punto de anclaje de la etiqueta, ya elevado sobre el planeta según su profundidad. */
  x: number;
  y: number;
  scale: number;
  opacity: number;
  zIndex: number;
  done: boolean;
}

export interface OrbitFrame {
  items: readonly OrbitProjection[];
  progress: number;
}

export type OrbitPalette = Record<OrbitTone | 'success' | 'sun' | 'halo' | 'star', string>;
