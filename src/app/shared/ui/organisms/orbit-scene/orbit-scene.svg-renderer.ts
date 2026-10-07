import { OrbitFrame, OrbitPalette, OrbitPhase, OrbitProjection } from './orbit-scene.model';
import type { OrbitRendererHandle } from './orbit-scene.renderer';
import { approach, bornFactor, cameraDistance, completedCount, FrameClock, mixHex, ORBIT_FOV, ORBIT_ROTATION, ORBIT_TILT } from './orbit-scene.motion';

interface SvgPlanet {
  phase: OrbitPhase;
  angle: number;
  mix: number;
  front: boolean;
  core: SVGCircleElement;
  glow: SVGCircleElement;
  doneGlow: SVGCircleElement;
}

/** Alternativa animada sin GPU. Conserva la perspectiva y el reloj de la escena WebGL. */
export class SvgOrbitRenderer implements OrbitRendererHandle {
  private static nextId = 0;
  private readonly id = `orbit-glow-${SvgOrbitRenderer.nextId++}`;
  private readonly planets: SvgPlanet[] = [];
  private readonly rings: { phase: OrbitPhase; path: SVGPathElement }[] = [];
  private readonly items: OrbitProjection[] = [];
  private readonly frame: { items: OrbitProjection[]; progress: number } = { items: this.items, progress: 0 };
  // Los planetas detrás del sol se dibujan antes que él y los de delante después.
  private readonly back: SVGGElement;
  private readonly front: SVGGElement;
  private readonly sun: SVGCircleElement;
  private readonly halo: SVGCircleElement;
  private readonly clock = new FrameClock();
  private readonly maxRadius: number;
  private width = 600;
  private height = 400;
  private cameraZ = 10;
  private elapsed = 0;
  private request: number | undefined;
  private running = false;
  private disposed = false;

  constructor(private readonly root: SVGGElement, phases: readonly OrbitPhase[],
    private readonly palette: OrbitPalette, private readonly onFrame: (frame: OrbitFrame) => void) {
    this.maxRadius = Math.max(0, ...phases.map(phase => phase.radius));
    const defs = this.element('defs');
    (['plan', 'coordinate', 'followup', 'success'] as const).forEach(tone => {
      const gradient = this.element('radialGradient', { id: `${this.id}-${tone}` });
      gradient.append(this.element('stop', { 'stop-color': palette[tone], 'stop-opacity': '0.53' }),
        this.element('stop', { offset: '1', 'stop-color': palette[tone], 'stop-opacity': '0' }));
      defs.append(gradient);
    });
    const haloGradient = this.element('radialGradient', { id: `${this.id}-halo` });
    haloGradient.append(this.element('stop', { 'stop-color': palette.sun, 'stop-opacity': '0.9' }),
      this.element('stop', { offset: '0.3', 'stop-color': palette.halo, 'stop-opacity': '0.45' }),
      this.element('stop', { offset: '1', 'stop-color': palette.halo, 'stop-opacity': '0' }));
    // Brillo desplazado arriba a la izquierda para dar volumen al sol.
    const sunGradient = this.element('radialGradient', { id: `${this.id}-sun`, fx: '0.35', fy: '0.35' });
    sunGradient.append(this.element('stop', { 'stop-color': '#ffffff' }),
      this.element('stop', { offset: '0.5', 'stop-color': palette.sun }),
      this.element('stop', { offset: '1', 'stop-color': palette.halo }));
    defs.append(haloGradient, sunGradient);
    root.append(defs);

    phases.forEach((phase, phaseIndex) => {
      const path = this.element('path', { fill: 'none', stroke: palette[phase.tone], 'stroke-opacity': '0.32', 'stroke-width': '1' });
      root.append(path);
      this.rings.push({ phase, path });
      phase.items.forEach((_item, index) => {
        // Dos halos que se funden entre sí: el gradiente no se puede interpolar directamente.
        const glow = this.element('circle', { fill: `url(#${this.id}-${phase.tone})` });
        const doneGlow = this.element('circle', { fill: `url(#${this.id}-success)`, opacity: '0' });
        const core = this.element('circle', { fill: palette[phase.tone] });
        this.planets.push({ phase, angle: index / phase.items.length * Math.PI * 2 + phaseIndex * 0.9,
          mix: 0, front: false, core, glow, doneGlow });
        this.items.push({ x: 0, y: 0, scale: 1, opacity: 0, zIndex: 0, done: false });
      });
    });
    this.back = this.element('g');
    this.front = this.element('g');
    this.halo = this.element('circle', { fill: `url(#${this.id}-halo)` });
    this.sun = this.element('circle', { fill: `url(#${this.id}-sun)` });
    root.append(this.back, this.halo, this.sun, this.front);
    this.planets.forEach(planet => this.back.append(planet.glow, planet.doneGlow, planet.core));
  }

  resize(width: number, height: number): void {
    if (this.disposed || width <= 0 || height <= 0) return;
    this.width = width;
    this.height = height;
    this.cameraZ = cameraDistance(width, height, this.maxRadius);
    this.root.ownerSVGElement!.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.rings.forEach(({ phase, path }) => {
      const points = Array.from({ length: 193 }, (_, index) => {
        const point = this.project(phase.radius, index / 192 * Math.PI * 2);
        return `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      });
      path.setAttribute('d', points.join(' ') + 'Z');
    });
    this.draw(0);
  }

  setRunning(running: boolean): void {
    if (this.disposed || running === this.running) return;
    this.running = running;
    this.clock.reset();
    if (running) this.request = requestAnimationFrame(this.tick);
    else if (this.request !== undefined) { cancelAnimationFrame(this.request); this.request = undefined; }
  }

  dispose(): void {
    this.setRunning(false);
    this.disposed = true;
    this.root.replaceChildren();
  }

  private readonly tick = (time: number): void => {
    if (!this.running || this.disposed) return;
    const dt = this.clock.next(time);
    this.elapsed += dt;
    this.draw(dt);
    this.request = requestAnimationFrame(this.tick);
  };

  private project(radius: number, angle: number) {
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = y * Math.sin(ORBIT_TILT);
    const distance = this.cameraZ - z;
    const scale = this.height / (2 * Math.tan(ORBIT_FOV * Math.PI / 360) * distance);
    return {
      x: this.width / 2 + (x * Math.cos(ORBIT_ROTATION) - y * Math.cos(ORBIT_TILT) * Math.sin(ORBIT_ROTATION)) * scale,
      y: this.height / 2 - (x * Math.sin(ORBIT_ROTATION) + y * Math.cos(ORBIT_TILT) * Math.cos(ORBIT_ROTATION)) * scale,
      scale, perspective: this.cameraZ / distance, front: z >= 0,
      depth: radius ? (z / (radius * Math.sin(ORBIT_TILT)) + 1) / 2 : 0.5
    };
  }

  private draw(dt: number): void {
    const count = this.planets.length;
    const completed = completedCount(this.elapsed, count);
    const center = this.project(0, 0);
    const pulse = 1 + 0.04 * Math.sin(this.elapsed * 2);
    this.circle(this.sun, center.x, center.y, 0.62 * center.scale * pulse);
    this.circle(this.halo, center.x, center.y, 2.1 * center.scale * pulse);
    this.planets.forEach((planet, index) => {
      const point = this.project(planet.phase.radius, planet.angle + this.elapsed * planet.phase.speed);
      const done = index < completed;
      const born = bornFactor(this.elapsed, index);
      planet.mix = approach(planet.mix, done ? 1 : 0, dt);
      if (point.front !== planet.front) {
        planet.front = point.front;
        (point.front ? this.front : this.back).append(planet.glow, planet.doneGlow, planet.core);
      }
      const radius = 0.15 * point.scale * (0.6 + 0.4 * born);
      this.circle(planet.core, point.x, point.y, radius);
      this.circle(planet.glow, point.x, point.y, radius * 3.2);
      this.circle(planet.doneGlow, point.x, point.y, radius * 3.2);
      planet.core.setAttribute('opacity', born.toFixed(3));
      planet.glow.setAttribute('opacity', (born * (1 - planet.mix)).toFixed(3));
      planet.doneGlow.setAttribute('opacity', (born * planet.mix).toFixed(3));
      const tone = this.palette[planet.phase.tone];
      planet.core.setAttribute('fill', mixHex(tone, this.palette.success, planet.mix)
        ?? (planet.mix > 0.5 ? this.palette.success : tone));
      const item = this.items[index];
      item.x = point.x;
      item.y = point.y - 14 * point.perspective;
      item.scale = 0.82 + 0.18 * point.depth;
      item.opacity = born * (0.45 + 0.55 * point.depth);
      item.zIndex = Math.round(point.depth * 100);
      item.done = done;
    });
    this.frame.progress = count ? Math.round(completed / count * 100) : 0;
    this.onFrame(this.frame);
  }

  private circle(node: SVGCircleElement, x: number, y: number, radius: number): void {
    node.setAttribute('cx', x.toFixed(2)); node.setAttribute('cy', y.toFixed(2)); node.setAttribute('r', radius.toFixed(2));
  }

  private element<K extends keyof SVGElementTagNameMap>(tag: K, attributes: Record<string, string> = {}): SVGElementTagNameMap[K] {
    const node = this.root.ownerDocument.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
  }
}
