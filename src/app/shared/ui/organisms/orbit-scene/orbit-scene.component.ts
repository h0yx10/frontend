import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, computed, ElementRef, inject, input, NgZone, OnChanges, OnDestroy, SimpleChanges, QueryList, signal, ViewChild, ViewChildren } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { SvgOrbitRenderer } from './orbit-scene.svg-renderer';
import { OrbitFrame, OrbitPalette, OrbitPhase } from './orbit-scene.model';
import { ORBIT_RENDERER_FACTORY, OrbitRendererHandle } from './orbit-scene.renderer';

@Component({
  selector: 'app-orbit-scene',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './orbit-scene.component.html',
  styleUrl: './orbit-scene.component.scss'
})
export class OrbitSceneComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly phases = input.required<readonly OrbitPhase[]>();
  readonly centerLabel = input('Tu evento');
  // La animación arranca siempre; el botón de pausa es el control para detener el movimiento.
  readonly paused = signal(false);
  readonly fallback = signal(true);
  readonly progress = signal(0);
  readonly items = computed(() => this.phases().flatMap((phase, phaseIndex) => phase.items.map((item, index) => {
    const angle = index / phase.items.length * Math.PI * 2 + phaseIndex * 0.9;
    return { ...item, tone: phase.tone, x: 50 + Math.cos(angle) * phase.radius / 3.85 * 38,
      y: 50 + Math.sin(angle) * phase.radius / 3.85 * 22 };
  })));

  @ViewChild('svgScene', { static: true }) private svgScene!: ElementRef<SVGGElement>;
  @ViewChild('canvas', { static: true }) private canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChildren('chip') private chips!: QueryList<ElementRef<HTMLElement>>;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly createRenderer = inject(ORBIT_RENDERER_FACTORY);
  private renderer?: OrbitRendererHandle;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private visible = true;
  private destroyed = false;
  private viewReady = false;
  private generation = 0;
  private readonly stackOrder: number[] = [];
  private readonly stackRank: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady && changes['phases']) {
      queueMicrotask(() => {
        if (!this.destroyed) this.zone.runOutsideAngular(() => void this.initialize());
      });
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.zone.runOutsideAngular(() => {
      // Diferir las señales hasta después del primer chequeo de la vista.
      queueMicrotask(() => {
        if (!this.destroyed) void this.initialize();
      });
      this.document.addEventListener('visibilitychange', this.updateRunning);
      this.canvas.nativeElement.addEventListener('webglcontextlost', this.onContextLost);
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.host.nativeElement);
      this.intersectionObserver = new IntersectionObserver(entries => {
        this.visible = entries[0]?.isIntersecting ?? true;
        this.updateRunning();
      });
      this.intersectionObserver.observe(this.host.nativeElement);
    });
  }

  togglePause(): void {
    this.paused.update(value => !value);
    this.zone.runOutsideAngular(this.updateRunning);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.generation++;
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.document.removeEventListener('visibilitychange', this.updateRunning);
    this.canvas.nativeElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.releaseRenderer();
  }

  private async initialize(): Promise<void> {
    const generation = ++this.generation;
    this.releaseRenderer();
    if (this.destroyed) return;
    this.zone.run(() => { this.fallback.set(true); this.progress.set(0); });
    this.resetChips();
    const palette = this.readPalette();
    this.useSvg(palette);
    try {
      const renderer = await this.createRenderer(this.canvas.nativeElement, this.phases(), palette,
        frame => { if (!this.destroyed && generation === this.generation) this.applyFrame(frame); });
      if (this.destroyed || generation !== this.generation) { renderer.dispose(); return; }
      this.releaseRenderer();
      this.renderer = renderer;
      this.resize();
      this.zone.run(() => this.fallback.set(false));
      this.updateRunning();
    } catch {
      if (!this.destroyed && generation === this.generation) {
        this.zone.run(() => this.fallback.set(true));
      }
    }
  }

  private readonly updateRunning = (): void => {
    this.renderer?.setRunning(!this.paused() && this.visible && this.document.visibilityState !== 'hidden');
  };

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.generation++;
    this.releaseRenderer();
    this.zone.runOutsideAngular(() => this.useSvg(this.readPalette()));
  };

  private useSvg(palette: OrbitPalette): void {
    this.zone.run(() => this.fallback.set(true));
    this.renderer = new SvgOrbitRenderer(this.svgScene.nativeElement, this.phases(), palette,
      frame => { if (!this.destroyed) this.applyFrame(frame); });
    this.resize();
    this.updateRunning();
  }

  private readPalette(): OrbitPalette {
    const styles = getComputedStyle(this.host.nativeElement);
    const tones = ['plan', 'coordinate', 'followup', 'success', 'sun', 'halo', 'star'] as const;
    return Object.fromEntries(tones.map(tone => [tone, styles.getPropertyValue(`--orbit-${tone}`).trim()])) as OrbitPalette;
  }

  private resize(): void {
    const { width, height } = this.host.nativeElement.getBoundingClientRect();
    this.renderer?.resize(width, height);
  }

  private releaseRenderer(): void {
    const renderer = this.renderer;
    this.renderer = undefined;
    renderer?.dispose();
  }

  private applyFrame(frame: OrbitFrame): void {
    // Apilamiento por orden relativo, no por profundidad absoluta: así el z-index sólo cambia cuando
    // dos etiquetas se cruzan. Cambiarlo cada pocos frames obliga a repintar el chip y su texto tiembla.
    const order = this.stackOrder;
    order.length = frame.items.length;
    for (let i = 0; i < order.length; i++) order[i] = i;
    order.sort((a, b) => frame.items[a].zIndex - frame.items[b].zIndex || a - b);
    // Las etiquetas de la mitad delantera pasan por encima del rótulo del sol (z-index 50).
    order.forEach((itemIndex, rank) => this.stackRank[itemIndex] = rank + 1 + (frame.items[itemIndex].zIndex >= 50 ? 60 : 0));
    this.chips.forEach((chip, index) => {
      const item = frame.items[index];
      if (!item) return;
      const element = chip.nativeElement;
      // Sólo las coordenadas geométricas cambian por frame; colores y apariencia usan tokens CSS.
      if (element.style.left !== '0px') {
        element.style.left = '0px';
        element.style.top = '0px';
      }
      // Subpíxeles intactos: redondear a píxeles enteros produce saltos visibles en movimientos lentos.
      element.style.transform = `translate3d(${item.x.toFixed(2)}px, ${item.y.toFixed(2)}px, 0) translate(-50%, -100%) scale(${item.scale.toFixed(4)})`;
      element.style.opacity = item.opacity.toFixed(3);
      const zIndex = String(this.stackRank[index]);
      if (element.style.zIndex !== zIndex) element.style.zIndex = zIndex;
      if (element.classList.contains('done') !== item.done) element.classList.toggle('done', item.done);
    });
    if (this.progress() !== frame.progress) this.zone.run(() => this.progress.set(frame.progress));
  }

  private resetChips(): void {
    const items = this.items();
    this.chips?.forEach((chip, index) => {
      const item = items[index];
      if (!item) return;
      chip.nativeElement.style.left = `${item.x}%`;
      chip.nativeElement.style.top = `${item.y}%`;
      chip.nativeElement.style.transform = '';
      chip.nativeElement.style.opacity = '';
      chip.nativeElement.style.zIndex = '';
      chip.nativeElement.classList.remove('done');
    });
  }
}
