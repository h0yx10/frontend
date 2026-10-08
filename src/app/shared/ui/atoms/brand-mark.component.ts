import { Component } from '@angular/core';

/** Isotipo de Eventia (calendario con check). Escala con el tamaño que le dé el contenedor. */
@Component({
  selector: 'app-brand-mark',
  standalone: true,
  template: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--color-primary)" />
      <rect x="16" y="19" width="32" height="29" rx="6" fill="none" stroke="#fff" stroke-width="3.4" />
      <path d="M16 28h32M24 14v8M40 14v8" stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none" />
      <path d="m25 38 5 5 9-9" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    </svg>
  `,
  styles: `
    :host { display: inline-block; width: 2.25rem; height: 2.25rem; }
    svg { display: block; width: 100%; height: 100%; }
  `
})
export class BrandMarkComponent {}
