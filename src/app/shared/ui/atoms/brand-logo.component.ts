import { Component } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `
    <img src="assets/images/eventia-logo.png" alt="Eventia — Logistics command" width="154" height="40" />
  `,
  styles: `
    :host {
      display: block;
      width: 9.625rem;
      max-width: 100%;
      margin-inline: 0;
    }

    img {
      display: block;
      width: 100%;
      height: auto;
    }
  `
})
export class BrandLogoComponent {}
