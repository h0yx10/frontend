import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Fondo decorativo independiente del tamaño y del motor de la escena orbital. */
@Component({
  selector: 'app-starfield',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    @for (star of stars; track $index) {
      <span [style.left.%]="star.x" [style.top.%]="star.y"
        [style.width.px]="star.size" [style.height.px]="star.size" [style.opacity]="star.opacity"></span>
    }
  `,
  styles: `
    :host { display: block; position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
    span {
      position: absolute; border-radius: 50%;
      background: currentColor; color: var(--orbit-star, var(--color-muted));
      box-shadow: 0 0 3px currentColor;
    }
  `
})
export class StarfieldComponent {
  // Distribución determinista: no cambia al escribir en el formulario ni al redimensionar.
  readonly stars = Array.from({ length: 180 }, (_, index) => ({
    x: ((index + 1) * 0.61803398875 % 1) * 100,
    y: ((index + 1) ** 2 * 0.41421356237 % 1) * 100,
    size: index % 5 === 0 ? 2 : 1,
    opacity: 0.25 + index % 4 * 0.1
  }));
}
