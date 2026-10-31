import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { TooltipDirective } from './tooltip.directive';

/** Casilla de verificación en forma de botón: marca una gestión como hecha con un clic. */
@Component({
  selector: 'app-check-button',
  standalone: true,
  imports: [MatIconModule, TooltipDirective],
  template: `
    <button
      type="button"
      role="checkbox"
      class="flex size-5 items-center justify-center rounded-md border border-border-strong text-success transition hover:border-accent"
      [class]="checked() ? 'bg-success-soft' : 'bg-canvas'"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label()"
      [appTooltip]="tooltip()"
      [appTooltipDisabled]="!tooltip()"
      (click)="toggled.emit()"
    >
      @if (checked()) {
        <mat-icon class="text-[14px]" aria-hidden="true">check</mat-icon>
      }
    </button>
  `,
  styles: `:host { display: inline-flex; }`
})
export class CheckButtonComponent {
  readonly checked = input(false);
  readonly label = input.required<string>();
  /** Texto corto de la etiqueta flotante; vacío para no mostrarla. */
  readonly tooltip = input('');
  readonly toggled = output<void>();
}
