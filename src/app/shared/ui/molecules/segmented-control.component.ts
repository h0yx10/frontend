import { Component, input, model } from '@angular/core';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
}

/** Selector de una opción entre pocas (filtros tipo pestaña). Funciona como grupo de botones de radio. */
@Component({
  selector: 'app-segmented-control',
  standalone: true,
  template: `
    <div class="inline-flex gap-1 rounded-xl border border-border bg-surface p-1" role="radiogroup" [attr.aria-label]="ariaLabel()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          role="radio"
          class="h-9 rounded-lg px-4 text-sm font-medium transition"
          [class]="value() === option.value ? 'bg-surface-raised text-ink' : 'text-muted hover:text-ink'"
          [attr.aria-checked]="value() === option.value"
          (click)="value.set(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `
})
export class SegmentedControlComponent {
  readonly options = input.required<readonly SegmentedOption[]>();
  readonly ariaLabel = input('Filtrar');
  readonly value = model<string>('');
}
