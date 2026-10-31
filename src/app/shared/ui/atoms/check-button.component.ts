import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Casilla de verificación en forma de botón: marca una gestión como hecha con un clic.
 * Mide 24×24 px (WCAG 2.5.8): con 20 px era fácil marcar la gestión equivocada; un error se
 * corrige con "Deshacer" en el aviso.
 */
@Component({
  selector: 'app-check-button',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <button
      type="button"
      role="checkbox"
      class="flex size-6 items-center justify-center rounded-md border-2 border-muted text-success transition hover:border-accent"
      [class]="checked() ? 'bg-success-soft' : 'bg-canvas'"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      (click)="toggled.emit()"
    >
      @if (checked()) {
        <mat-icon class="text-[16px]" aria-hidden="true">check</mat-icon>
      }
    </button>
  `,
  styles: `:host { display: inline-flex; }`
})
export class CheckButtonComponent {
  readonly checked = input(false);
  readonly label = input.required<string>();
  readonly toggled = output<void>();
}
