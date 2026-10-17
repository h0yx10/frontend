import { Component } from '@angular/core';

/**
 * Isotipo de Eventia: el mismo icono del logo horizontal de la autenticación (`brand-logo`).
 * Recorta del PNG el calendario con el check (x 2–39, y 1–38 de 154×42) y escala con su contenedor.
 */
@Component({
  selector: 'app-brand-mark',
  standalone: true,
  host: { 'aria-hidden': 'true' },
  template: `<img src="assets/images/eventia-logo.png" alt="" width="154" height="42" />`,
  styles: `
    :host { position: relative; display: inline-block; width: 2.25rem; height: 2.25rem; overflow: hidden; }
    img {
      position: absolute;
      left: -5.27%;
      top: -2.64%;
      width: auto;
      max-width: none;
      height: 110.53%;
    }
  `
})
export class BrandMarkComponent {}
