import { Component, input } from '@angular/core';

/**
 * Bloque de esqueleto de carga: reserva el espacio del contenido que viene en camino con un brillo
 * que lo recorre. Es decorativo; quien lo compone anuncia la carga a los lectores de pantalla.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  host: {
    'aria-hidden': 'true',
    '[style.height]': 'height()',
    '[style.width]': 'width()',
    '[style.border-radius]': 'radius()'
  },
  template: '',
  styles: `
    :host {
      position: relative;
      display: block;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--color-skeleton);
    }

    :host::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgb(169 155 255 / 10%), transparent);
      animation: shimmer 1.4s ease-in-out infinite;
    }

    @keyframes shimmer {
      to { transform: translateX(100%); }
    }

    /* Indica que algo está cargando: se mantiene animado aunque se pida movimiento reducido. */
    @media (prefers-reduced-motion: reduce) {
      :host::after {
        animation-duration: 1.4s !important;
        animation-iteration-count: infinite !important;
      }
    }
  `
})
export class SkeletonComponent {
  readonly height = input('34px');
  readonly width = input('100%');
  readonly radius = input('8px');
}
