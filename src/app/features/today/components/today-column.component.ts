import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

export type ColumnTone = 'danger' | 'accent' | 'warning';

/** Columna del tablero Hoy: encabezado con contador y, si no hay nada, un estado vacío ilustrado. */
@Component({
  selector: 'app-today-column',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <section
      class="flex min-w-0 flex-col rounded-2xl border bg-surface p-4"
      [class]="highlighted() ? 'border-primary' : 'border-border'"
    >
      <header class="mb-4 flex items-center gap-2">
        <mat-icon class="text-[20px]" [class]="iconClass()" aria-hidden="true">{{ icon() }}</mat-icon>
        <h2 class="flex-1 text-[15px] font-semibold text-ink">{{ title() }}</h2>
        <span
          class="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums"
          [class]="badgeClass()"
          [attr.aria-label]="count() + ' en ' + title()"
        >{{ count() }}</span>
      </header>

      @if (empty()) {
        <div class="flex min-h-64 flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong px-4 py-8 text-center">
          <mat-icon class="mb-2 text-[40px]" [class]="emptyIconClass()" aria-hidden="true">{{ emptyIcon() }}</mat-icon>
          <p class="text-[15px] font-semibold text-ink">{{ emptyTitle() }}</p>
          <p class="text-sm text-muted">{{ emptyMessage() }}</p>
          @if (emptyLink()) {
            <a [routerLink]="emptyLink()" class="mt-2 text-sm font-medium text-accent hover:text-ink">{{ emptyLinkLabel() }}</a>
          }
        </div>
      } @else {
        <div class="flex flex-col gap-3"><ng-content /></div>
      }
    </section>
  `,
  styles: `:host { display: flex; min-width: 0; } section { flex: 1; }`
})
export class TodayColumnComponent {
  readonly title = input.required<string>();
  readonly icon = input.required<string>();
  readonly tone = input<ColumnTone>('accent');
  readonly count = input(0);
  readonly empty = input(false);
  /** Resalta el borde: la columna con trabajo para hoy es el foco de la pantalla. */
  readonly highlighted = input(false);
  readonly emptyIcon = input('inbox');
  readonly emptyIconClass = input('text-muted');
  readonly emptyTitle = input('Sin resultados');
  readonly emptyMessage = input('');
  readonly emptyLink = input('');
  readonly emptyLinkLabel = input('');

  readonly iconClass = computed(() => ICON_CLASSES[this.tone()]);
  readonly badgeClass = computed(() => {
    if (this.count() === 0) return 'bg-surface-raised text-muted';
    return BADGE_CLASSES[this.tone()];
  });
}

const ICON_CLASSES: Record<ColumnTone, string> = {
  danger: 'text-danger',
  accent: 'text-accent',
  warning: 'text-warning'
};

const BADGE_CLASSES: Record<ColumnTone, string> = {
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-primary text-white',
  warning: 'bg-warning-soft text-warning'
};
