import { InjectionToken } from '@angular/core';
import type { BufferGeometry, Color, Material, Mesh, MeshStandardMaterial, Points, PointsMaterial, Scene, Sprite, SpriteMaterial, PerspectiveCamera, Vector3, WebGLRenderer } from 'three';
import { OrbitFrame, OrbitPalette, OrbitPhase, OrbitProjection } from './orbit-scene.model';
import { approach, bornFactor, cameraDistance, completedCount, FrameClock, ORBIT_FOV, ORBIT_ROTATION, ORBIT_TILT, seededRandom } from './orbit-scene.motion';

type ThreeModule = typeof import('three');
export interface OrbitRendererHandle {
  resize(width: number, height: number): void;
  setRunning(running: boolean): void;
  dispose(): void;
}
export type OrbitRendererFactory = (
  canvas: HTMLCanvasElement, phases: readonly OrbitPhase[], palette: OrbitPalette,
  onFrame: (frame: OrbitFrame) => void
) => Promise<OrbitRendererHandle>;

/** El import dinámico mantiene Three.js fuera del bundle inicial de autenticación. */
export const ORBIT_RENDERER_FACTORY = new InjectionToken<OrbitRendererFactory>('Orbit renderer', {
  providedIn: 'root',
  factory: () => async (canvas, phases, palette, onFrame) => {
    const three = await import('three');
    return new OrbitRenderer(three, canvas, phases, palette, onFrame);
  }
});

interface Planet {
  phase: OrbitPhase;
  angle: number;
  mesh: Mesh;
  glow: Sprite;
  tone: Color;
  /** 0 = pendiente, 1 = completada; se interpola para que el cambio de color no sea brusco. */
  mix: number;
}

class OrbitRenderer implements OrbitRendererHandle {
  private readonly renderer: WebGLRenderer;
  private readonly scene: Scene;
  private readonly camera: PerspectiveCamera;
  private readonly glowTexture: import('three').DataTexture;
  private readonly sun: Mesh;
  private readonly halo: Sprite;
  private readonly starMaterial: PointsMaterial;
  private readonly success: Color;
  private readonly scratch: Color;
  private readonly maxRadius: number;
  private readonly planets: Planet[] = [];
  // Reutilizados en cada frame para no generar basura (las pausas del GC se perciben como tirones).
  private readonly items: OrbitProjection[] = [];
  private readonly frame: { items: OrbitProjection[]; progress: number } = { items: this.items, progress: 0 };
  private readonly clock = new FrameClock();
  private width = 1;
  private height = 1;
  private cameraZ = 10;
  private elapsed = 0;
  private disposed = false;
  private running = false;

  constructor(private readonly three: ThreeModule, canvas: HTMLCanvasElement,
    phases: readonly OrbitPhase[], palette: OrbitPalette,
    private readonly onFrame: (frame: OrbitFrame) => void) {
    // Colores e iluminación sin conversión sRGB, como la escena de referencia del diseño.
    three.ColorManagement.enabled = false;
    this.renderer = new three.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.outputColorSpace = three.LinearSRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0, 0);
    this.scene = new three.Scene();
    this.camera = new three.PerspectiveCamera(ORBIT_FOV, 1, 0.1, 100);
    this.glowTexture = this.makeGlowTexture();
    this.success = new three.Color(palette.success);
    this.scratch = new three.Color();
    this.maxRadius = Math.max(0, ...phases.map(phase => phase.radius));

    // El sol es la fuente de luz: ilumina la cara de cada planeta que lo mira.
    // Intensidades ×π: equivalen a las luces "legacy" de la referencia en el modelo físico actual.
    this.scene.add(new three.AmbientLight(0x9d94ff, 0.35 * Math.PI), new three.PointLight(0xffffff, 2.2 * Math.PI, 40, 0));
    this.sun = new three.Mesh(new three.SphereGeometry(0.62, 48, 48), new three.MeshBasicMaterial({ color: palette.sun }));
    this.halo = this.makeGlow(palette.halo, 1);
    this.halo.scale.setScalar(4.2);
    this.scene.add(this.sun, this.halo);

    phases.forEach((phase, phaseIndex) => {
      const points = Array.from({ length: 257 }, (_, i) => this.world(phase.radius, i / 256 * Math.PI * 2, new three.Vector3()));
      this.scene.add(new three.Line(new three.BufferGeometry().setFromPoints(points),
        new three.LineBasicMaterial({ color: palette[phase.tone], transparent: true, opacity: 0.32 })));
      phase.items.forEach((_item, index) => {
        const tone = new three.Color(palette[phase.tone]);
        const mesh = new three.Mesh(new three.SphereGeometry(0.15, 32, 32), new three.MeshStandardMaterial({
          color: tone, emissive: tone, emissiveIntensity: 0.35, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0 }));
        // El halo es hijo del planeta: hereda su posición y su escala de entrada.
        const glow = this.makeGlow(palette[phase.tone], 0);
        glow.scale.setScalar(0.9);
        mesh.add(glow);
        this.scene.add(mesh);
        this.planets.push({ phase, angle: index / phase.items.length * Math.PI * 2 + phaseIndex * 0.9, mesh, glow, tone, mix: 0 });
        this.items.push({ x: 0, y: 0, scale: 1, opacity: 0, zIndex: 0, done: false });
      });
    });

    // Cúpula de estrellas alrededor de la escena, siempre detrás de la cámara.
    const random = seededRandom(41);
    const positions = new Float32Array(500 * 3);
    const direction = new three.Vector3();
    for (let i = 0; i < 500; i++) {
      direction.set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize().multiplyScalar(18 + random() * 12);
      if (direction.z > 5) direction.z = -direction.z;
      positions.set([direction.x, direction.y, direction.z], i * 3);
    }
    this.starMaterial = new three.PointsMaterial({ color: palette.star, size: 0.09, transparent: true, opacity: 0.6 });
    this.scene.add(new three.Points(new three.BufferGeometry().setAttribute('position', new three.BufferAttribute(positions, 3)), this.starMaterial));
  }

  resize(width: number, height: number): void {
    if (this.disposed || !width || !height) return;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);
    this.cameraZ = cameraDistance(width, height, this.maxRadius);
    this.camera.aspect = width / height;
    this.camera.position.set(0, 0, this.cameraZ);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    this.draw(0);
  }

  setRunning(running: boolean): void {
    if (this.disposed || this.running === running) return;
    this.running = running;
    this.clock.reset();
    this.renderer.setAnimationLoop(running ? (time: number) => {
      const dt = this.clock.next(time);
      this.elapsed += dt;
      this.draw(dt);
    } : null);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    this.scene.traverse(object => {
      const drawable = object as unknown as { geometry?: BufferGeometry; material?: Material | Material[] };
      if (drawable.geometry) geometries.add(drawable.geometry);
      if (drawable.material) (Array.isArray(drawable.material) ? drawable.material : [drawable.material]).forEach(m => materials.add(m));
    });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    this.glowTexture.dispose();
    this.scene.clear();
    this.renderer.dispose();
  }

  private world(radius: number, angle: number, target: Vector3): Vector3 {
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return target.set(
      x * Math.cos(ORBIT_ROTATION) - y * Math.cos(ORBIT_TILT) * Math.sin(ORBIT_ROTATION),
      x * Math.sin(ORBIT_ROTATION) + y * Math.cos(ORBIT_TILT) * Math.cos(ORBIT_ROTATION),
      y * Math.sin(ORBIT_TILT)
    );
  }

  private draw(dt: number): void {
    const count = this.planets.length;
    const completed = completedCount(this.elapsed, count);
    const pulse = 1 + 0.04 * Math.sin(this.elapsed * 2);
    this.sun.scale.setScalar(pulse);
    this.halo.scale.setScalar(4.2 * pulse);
    this.starMaterial.opacity = 0.45 + 0.15 * Math.sin(this.elapsed);
    const focal = this.height / (2 * Math.tan(ORBIT_FOV * Math.PI / 360));
    this.planets.forEach((planet, index) => {
      const done = index < completed;
      const born = bornFactor(this.elapsed, index);
      planet.mix = approach(planet.mix, done ? 1 : 0, dt);
      const position = this.world(planet.phase.radius, planet.angle + this.elapsed * planet.phase.speed, planet.mesh.position);
      planet.mesh.scale.setScalar(0.6 + 0.4 * born);
      const material = planet.mesh.material as MeshStandardMaterial;
      const color = this.scratch.lerpColors(planet.tone, this.success, planet.mix);
      material.color.copy(color);
      material.emissive.copy(color);
      material.opacity = born;
      const glow = planet.glow.material as SpriteMaterial;
      glow.color.copy(color);
      glow.opacity = 0.6 * born;
      // Proyección directa con la misma cámara: la etiqueta flota más alto cuanto más cerca está el planeta.
      const distance = this.cameraZ - position.z;
      const depth = (position.z / (planet.phase.radius * Math.sin(ORBIT_TILT)) + 1) / 2;
      const perspective = this.cameraZ / distance;
      const item = this.items[index];
      item.x = this.width / 2 + position.x * focal / distance;
      item.y = this.height / 2 - position.y * focal / distance - 14 * perspective;
      item.scale = 0.82 + 0.18 * depth;
      item.opacity = born * (0.45 + 0.55 * depth);
      item.zIndex = Math.round(depth * 100);
      item.done = done;
    });
    this.renderer.render(this.scene, this.camera);
    this.frame.progress = count ? Math.round(completed / count * 100) : 0;
    this.onFrame(this.frame);
  }

  /** Halo radial: núcleo intenso que cae al 45 % a un cuarto del radio y se desvanece en el borde. */
  private makeGlowTexture(): import('three').DataTexture {
    const size = 128;
    const bytes = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const radius = Math.min(1, Math.hypot((x + 0.5) / size * 2 - 1, (y + 0.5) / size * 2 - 1));
      const alpha = radius < 0.25 ? 1 - radius / 0.25 * 0.55 : 0.45 * (1 - (radius - 0.25) / 0.75);
      const index = (y * size + x) * 4;
      bytes[index] = bytes[index + 1] = bytes[index + 2] = 255;
      bytes[index + 3] = Math.round(alpha * 255);
    }
    const texture = new this.three.DataTexture(bytes, size, size, this.three.RGBAFormat);
    texture.magFilter = this.three.LinearFilter;
    texture.minFilter = this.three.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
    return texture;
  }

  private makeGlow(color: string, opacity: number): Sprite {
    return new this.three.Sprite(new this.three.SpriteMaterial({ color, map: this.glowTexture,
      transparent: true, opacity, blending: this.three.AdditiveBlending, depthWrite: false }));
  }
}
