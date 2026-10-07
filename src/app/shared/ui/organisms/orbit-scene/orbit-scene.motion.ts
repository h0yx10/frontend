/** Reloj y curvas compartidas por los renderers WebGL y SVG para que ambos se muevan igual. */
export const ORBIT_TILT = 1.08;
export const ORBIT_ROTATION = -0.14;

export const ORBIT_FOV = 40;

/** Primera gestión completada, intervalo entre gestiones, espera con todo listo y reinicio. */
const FIRST = 2.2;
const STEP = 1.5;
const HOLD = 3.2;
const RESTART = 1.2;

/**
 * Reloj de animación que avanza en múltiplos exactos del periodo de refresco.
 * Los timestamps de requestAnimationFrame traen ruido (Brave y Firefox los alteran a propósito
 * contra el fingerprinting); usarlos tal cual hace avanzar las esferas a pasos desiguales y
 * se perciben temblando. Aquí se estima el periodo con un promedio lento y cada frame avanza
 * 1, 2… periodos completos, de modo que el movimiento queda perfectamente regular.
 */
export class FrameClock {
  private previous: number | null = null;
  private interval = 1 / 60;
  private seeded = false;
  /** Tiempo real aún no convertido en periodos; el ruido de cada timestamp se compensa en el siguiente. */
  private debt = 0;

  /** Olvida el último timestamp (tras pausar) sin perder el periodo estimado. */
  reset(): void {
    this.previous = null;
  }

  next(time: number): number {
    if (this.previous === null) { this.previous = time; return 0; }
    const raw = Math.max(time - this.previous, 0) / 1000;
    this.previous = time;
    if (raw > 0.25) return this.interval;
    if (!this.seeded && raw > 0.004 && raw < 0.05) { this.interval = raw; this.seeded = true; }
    // Sólo los frames no perdidos alimentan la estimación del periodo.
    else if (raw > 0.004 && raw < this.interval * 1.5) this.interval += (raw - this.interval) * 0.05;
    this.debt += raw;
    const steps = Math.min(4, Math.max(1, Math.round(this.debt / this.interval)));
    this.debt = Math.min(Math.max(this.debt - steps * this.interval, -this.interval), this.interval);
    return steps * this.interval;
  }
}

export function completedCount(elapsed: number, count: number): number {
  if (!count || elapsed < FIRST) return 0;
  const active = (count - 1) * STEP + HOLD;
  const cycle = (elapsed - FIRST) % (active + RESTART);
  return cycle >= active ? 0 : Math.min(count, Math.floor(cycle / STEP) + 1);
}

/** Entrada escalonada de cada planeta: 0 invisible, 1 presente. */
export function bornFactor(elapsed: number, index: number): number {
  return Math.min(1, Math.max(0, (elapsed - (0.35 + index * 0.12)) / 0.6));
}

/** Distancia de cámara que encuadra la órbita mayor; en pantallas estrechas se aleja más. */
export function cameraDistance(width: number, height: number, maxRadius: number): number {
  const fit = maxRadius * (width < 600 ? 1.5 : 1.18) / (Math.tan(ORBIT_FOV * Math.PI / 360) * (width / height));
  return Math.max(9.5, fit);
}

/** Generador determinista para que estrellas y composición sean estables entre cargas y pruebas. */
export function seededRandom(seed: number): () => number {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}

/** Aproximación exponencial independiente del framerate. */
export function approach(current: number, target: number, dt: number, rate = 6): number {
  return target + (current - target) * Math.exp(-rate * dt);
}

/** Interpola dos colores #rrggbb; devuelve null si alguno no es hexadecimal. */
export function mixHex(from: string, to: string, t: number): string | null {
  const a = parseHex(from);
  const b = parseHex(to);
  if (!a || !b) return null;
  const channel = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t).toString(16).padStart(2, '0');
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

function parseHex(color: string): [number, number, number] | null {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [value >> 16 & 255, value >> 8 & 255, value & 255];
}
