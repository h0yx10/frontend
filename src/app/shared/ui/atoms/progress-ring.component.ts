import { Component, computed, input } from '@angular/core';

/** Anillo de avance para resúmenes; el valor numérico lo muestra quien lo usa. */
@Component({
  selector: 'app-progress-ring',
  standalone: true,
  template: `
    <svg viewBox="0 0 100 100" role="img" [attr.aria-label]="'Avance ' + clamped() + '%'">
      <circle cx="50" cy="50" [attr.r]="radius" fill="none" stroke="var(--color-border-strong)" [attr.stroke-width]="stroke" />
      <circle
        cx="50" cy="50" [attr.r]="radius" fill="none" stroke="var(--color-primary)" [attr.stroke-width]="stroke"
        stroke-linecap="round" transform="rotate(-90 50 50)"
        [attr.stroke-dasharray]="circumference" [attr.stroke-dashoffset]="offset()"
      />
    </svg>
  `,
  styles: `
    :host { display: inline-block; width: 6rem; height: 6rem; }
    svg { display: block; width: 100%; height: 100%; }
    circle:last-child { transition: stroke-dashoffset 700ms var(--ease-out); }
    @media (prefers-reduced-motion: reduce) { circle:last-child { transition: none; } }
  `
})
export class ProgressRingComponent {
  readonly percentage = input.required<number>();

  readonly stroke = 9;
  readonly radius = 50 - this.stroke / 2 - 1;
  readonly circumference = 2 * Math.PI * this.radius;
  readonly clamped = computed(() => Math.min(100, Math.max(0, Math.round(this.percentage()))));
  readonly offset = computed(() => this.circumference * (1 - this.clamped() / 100));
}
