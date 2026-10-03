import { Component } from '@angular/core';

@Component({
  selector: 'app-brand-logo',
  standalone: true,
  template: `
    <img src="assets/images/eventia-logo.svg" alt="Eventia — Logistics command" width="990" height="720" />
  `,
  styles: `
    :host {
      display: block;
      width: 11rem;
      max-width: 100%;
      margin-inline: 0;
    }

    img {
      display: block;
      width: 100%;
      height: auto;
      filter: drop-shadow(0 4px 12px rgb(139 92 246 / 12%));
    }
  `
})
export class BrandLogoComponent {}
