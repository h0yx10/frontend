import { InjectionToken } from '@angular/core';
import type { BufferGeometry, Points, ShaderMaterial, WebGLRenderer } from 'three';

import { FrameClock, seededRandom } from '../organisms/orbit-scene/orbit-scene.motion';

type ThreeModule = typeof import('three');

export interface StarfieldColors {
  star: string;
  accent: string;
}

export interface StarfieldRendererHandle {
  resize(width: number, height: number): void;
  /** Desplazamiento del puntero normalizado a [-1, 1]; las capas cercanas se mueven más (parallax). */
  setPointer(x: number, y: number): void;
  setRunning(running: boolean): void;
  dispose(): void;
}

export type StarfieldRendererFactory = (canvas: HTMLCanvasElement, colors: StarfieldColors) => Promise<StarfieldRendererHandle>;

/** El import dinámico mantiene Three.js fuera del bundle inicial. */
export const STARFIELD_RENDERER_FACTORY = new InjectionToken<StarfieldRendererFactory>('Starfield renderer', {
  providedIn: 'root',
  factory: () => async (canvas, colors) => new StarfieldRenderer(await import('three'), canvas, colors)
});

/*
 * Las partículas viven en coordenadas de pantalla (NDC) en lugar de en el mundo 3D: así el campo
 * cubre cualquier relación de aspecto sin cálculos de frustum y el desplazamiento se puede envolver
 * con un simple `mod`, de modo que el fondo es infinito y nunca se vacía.
 * Cada estrella tiene una profundidad (0 lejos, 1 cerca) que define tamaño, velocidad y parallax.
 */
const VERTEX = /* glsl */ `
  attribute float aDepth;
  attribute float aPhase;
  attribute float aTwinkle;
  attribute float aTint;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform vec2 uDrift;
  varying float vAlpha;
  varying float vTint;

  void main() {
    float depth = aDepth * aDepth;
    vec2 p = position.xy + uDrift * uTime * mix(0.15, 1.0, depth) + uPointer * 0.035 * depth;
    // Margen de 0.05 para que la estrella salga por completo antes de reaparecer en el borde opuesto.
    p = mod(p + 1.05, 2.1) - 1.05;
    gl_Position = vec4(p, 0.0, 1.0);
    gl_PointSize = mix(1.1, 3.6, depth) * uPixelRatio;
    float twinkle = 0.5 + 0.5 * sin(uTime * aTwinkle + aPhase);
    vAlpha = mix(0.22, 0.85, aDepth) * mix(0.35, 1.0, twinkle * twinkle);
    vTint = aTint;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uStar;
  uniform vec3 uAccent;
  varying float vAlpha;
  varying float vTint;

  void main() {
    // Núcleo nítido con un halo suave: se lee como estrella y no como un cuadrado.
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float core = smoothstep(0.45, 0.0, r);
    float halo = pow(max(0.0, 1.0 - r), 2.5) * 0.6;
    float alpha = (core + halo) * vAlpha;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(mix(uStar, uAccent, vTint) * alpha, alpha);
  }
`;

class StarfieldRenderer implements StarfieldRendererHandle {
  private readonly renderer: WebGLRenderer;
  private readonly scene: import('three').Scene;
  private readonly camera: import('three').Camera;
  private readonly material: ShaderMaterial;
  private readonly clock = new FrameClock();
  private points?: Points<BufferGeometry, ShaderMaterial>;
  private readonly pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private count = 0;
  private elapsed = 0;
  private running = false;
  private disposed = false;

  constructor(private readonly three: ThreeModule, canvas: HTMLCanvasElement, colors: StarfieldColors) {
    this.renderer = new three.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0, 0);
    this.scene = new three.Scene();
    this.camera = new three.Camera();
    this.material = new three.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      // Alfa premultiplicado + mezcla aditiva: las estrellas que se cruzan suman brillo sin bordes oscuros.
      blending: three.CustomBlending,
      blendSrc: three.OneFactor,
      blendDst: three.OneMinusSrcAlphaFactor,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uPointer: { value: new three.Vector2() },
        uDrift: { value: new three.Vector2(0.006, 0.0025) },
        uStar: { value: rgb(three, colors.star, [0.73, 0.7, 0.91]) },
        uAccent: { value: rgb(three, colors.accent, [0.55, 0.49, 1]) }
      }
    });
  }

  resize(width: number, height: number): void {
    if (this.disposed || !width || !height) return;
    this.renderer.setSize(width, height, false);
    // Densidad constante por área: una pantalla grande no se ve vacía ni una pequeña saturada.
    const count = Math.round(Math.min(1600, Math.max(320, width * height / 1400)));
    if (count !== this.count) this.build(count);
    this.draw();
  }

  setPointer(x: number, y: number): void {
    this.pointer.targetX = x;
    this.pointer.targetY = y;
  }

  setRunning(running: boolean): void {
    if (this.disposed || this.running === running) return;
    this.running = running;
    this.clock.reset();
    this.renderer.setAnimationLoop(running ? (time: number) => {
      const dt = this.clock.next(time);
      this.elapsed += dt;
      // El parallax sigue al puntero con inercia para que no salte con cada evento del ratón.
      const ease = 1 - Math.exp(-3 * dt);
      this.pointer.x += (this.pointer.targetX - this.pointer.x) * ease;
      this.pointer.y += (this.pointer.targetY - this.pointer.y) * ease;
      this.draw();
    } : null);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.points?.geometry.dispose();
    this.material.dispose();
    this.scene.clear();
    this.renderer.dispose();
  }

  private build(count: number): void {
    this.count = count;
    if (this.points) {
      this.scene.remove(this.points);
      this.points.geometry.dispose();
    }
    // Determinista: la composición no cambia entre cargas.
    const random = seededRandom(7);
    const position = new Float32Array(count * 3);
    const depth = new Float32Array(count);
    const phase = new Float32Array(count);
    const twinkle = new Float32Array(count);
    const tint = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      position[i * 3] = random() * 2.1 - 1.05;
      position[i * 3 + 1] = random() * 2.1 - 1.05;
      // La mayoría lejanas y pequeñas; pocas cercanas y brillantes, como en un cielo real.
      depth[i] = Math.pow(random(), 2.2);
      phase[i] = random() * Math.PI * 2;
      twinkle[i] = 0.6 + random() * 2.2;
      tint[i] = random() < 0.18 ? 0.5 + random() * 0.5 : 0;
    }
    const geometry = new this.three.BufferGeometry()
      .setAttribute('position', new this.three.BufferAttribute(position, 3))
      .setAttribute('aDepth', new this.three.BufferAttribute(depth, 1))
      .setAttribute('aPhase', new this.three.BufferAttribute(phase, 1))
      .setAttribute('aTwinkle', new this.three.BufferAttribute(twinkle, 1))
      .setAttribute('aTint', new this.three.BufferAttribute(tint, 1));
    this.points = new this.three.Points(geometry, this.material);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
  }

  private draw(): void {
    const uniforms = this.material.uniforms;
    uniforms['uTime'].value = this.elapsed;
    (uniforms['uPointer'].value as import('three').Vector2).set(this.pointer.x, -this.pointer.y);
    this.renderer.render(this.scene, this.camera);
  }
}

/** Convierte `#rrggbb` a un vec3 sin gestión de color: el shader escribe el sRGB tal cual. */
function rgb(three: ThreeModule, color: string, fallback: [number, number, number]): import('three').Vector3 {
  const match = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return new three.Vector3(...fallback);
  const value = parseInt(match[1], 16);
  return new three.Vector3((value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255);
}
