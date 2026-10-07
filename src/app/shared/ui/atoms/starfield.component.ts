import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, NgZone, OnDestroy, signal, ViewChild } from '@angular/core';

import { STARFIELD_RENDERER_FACTORY, StarfieldRendererHandle } from './starfield.renderer';

/**
 * Fondo decorativo independiente del tamaño y del motor de la escena orbital.
 * Con WebGL es un sistema de partículas animado (Three.js, carga diferida); mientras carga
 * o si WebGL no está disponible se muestra el campo estático de puntos.
 */
@Component({
  selector: 'app-starfield',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.animated]': 'animated()' },
  template: `
    <canvas #canvas></canvas>
    <div class="static-stars">
      @for (star of stars; track $index) {
        <span [style.left.%]="star.x" [style.top.%]="star.y"
          [style.width.px]="star.size" [style.height.px]="star.size" [style.opacity]="star.opacity"></span>
      }
    </div>
  `,
  styles: `
    :host { display: block; position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    canvas, .static-stars { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity 900ms ease; }
    canvas { display: block; opacity: 0; }
    :host(.animated) canvas { opacity: 1; }
    :host(.animated) .static-stars { opacity: 0; }
    span {
      position: absolute; border-radius: 50%;
      background: currentColor; color: var(--orbit-star, var(--color-muted));
      box-shadow: 0 0 3px currentColor;
    }
  `
})
export class StarfieldComponent implements AfterViewInit, OnDestroy {
  // Distribución determinista: no cambia al escribir en el formulario ni al redimensionar.
  readonly stars = Array.from({ length: 180 }, (_, index) => ({
    x: ((index + 1) * 0.61803398875 % 1) * 100,
    y: ((index + 1) ** 2 * 0.41421356237 % 1) * 100,
    size: index % 5 === 0 ? 2 : 1,
    opacity: 0.25 + index % 4 * 0.1
  }));
  readonly animated = signal(false);

  @ViewChild('canvas', { static: true }) private canvas!: ElementRef<HTMLCanvasElement>;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly createRenderer = inject(STARFIELD_RENDERER_FACTORY);
  private renderer?: StarfieldRendererHandle;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => void this.initialize());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.document.removeEventListener('visibilitychange', this.updateRunning);
    this.document.defaultView?.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.nativeElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.release();
  }

  private async initialize(): Promise<void> {
    const styles = getComputedStyle(this.host.nativeElement);
    const colors = {
      star: styles.getPropertyValue('--orbit-star').trim(),
      accent: styles.getPropertyValue('--orbit-plan').trim()
    };
    let renderer: StarfieldRendererHandle;
    try {
      renderer = await this.createRenderer(this.canvas.nativeElement, colors);
    } catch {
      return; // Sin WebGL se queda el campo estático.
    }
    if (this.destroyed) { renderer.dispose(); return; }
    this.renderer = renderer;
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host.nativeElement);
    this.document.addEventListener('visibilitychange', this.updateRunning);
    this.document.defaultView?.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.canvas.nativeElement.addEventListener('webglcontextlost', this.onContextLost);
    this.updateRunning();
    this.zone.run(() => this.animated.set(true));
  }

  private resize(): void {
    const { width, height } = this.host.nativeElement.getBoundingClientRect();
    this.renderer?.resize(width, height);
  }

  private readonly updateRunning = (): void => {
    this.renderer?.setRunning(this.document.visibilityState !== 'hidden');
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const view = this.document.defaultView;
    if (!view || event.pointerType === 'touch') return;
    this.renderer?.setPointer(event.clientX / view.innerWidth * 2 - 1, event.clientY / view.innerHeight * 2 - 1);
  };

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.release();
    this.zone.run(() => this.animated.set(false));
  };

  private release(): void {
    const renderer = this.renderer;
    this.renderer = undefined;
    renderer?.dispose();
  }
}
