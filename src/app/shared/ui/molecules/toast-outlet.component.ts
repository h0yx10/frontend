import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ToastService } from '../../../core/feedback/toast.service';

/** Muestra las confirmaciones del ToastService; va una sola vez en el layout privado. */
@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6"
      role="status" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border bg-surface px-4 py-3 text-sm text-ink shadow-modal"
          [class.border-success]="toast.tone === 'success'"
          [class.border-warning]="toast.tone === 'warning'"
          [class.border-border]="toast.tone === 'info'">
          <mat-icon class="shrink-0 text-[18px]" aria-hidden="true"
            [class.text-success]="toast.tone === 'success'"
            [class.text-warning]="toast.tone === 'warning'"
            [class.text-accent]="toast.tone === 'info'">{{ icon(toast.tone) }}</mat-icon>
          <p class="min-w-0 flex-1 leading-snug">{{ toast.message }}</p>
          <button type="button" class="shrink-0 text-muted transition hover:text-ink" aria-label="Cerrar aviso"
            (click)="toasts.dismiss(toast.id)">
            <mat-icon class="text-[16px]" aria-hidden="true">close</mat-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastOutletComponent {
  readonly toasts = inject(ToastService);

  icon(tone: string): string {
    return tone === 'success' ? 'check_circle' : tone === 'warning' ? 'warning' : 'info';
  }
}
