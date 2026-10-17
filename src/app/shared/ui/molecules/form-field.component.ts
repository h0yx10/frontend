import { Component, input } from '@angular/core';

/** Composición visual; el FormControl y la validación pertenecen a la página. */
@Component({
  selector: 'app-form-field',
  standalone: true,
  template: `
    <div class="mb-2 flex items-center justify-between gap-3">
      <label [for]="inputId()" class="text-[13px] font-semibold">{{ label() }}</label>
      <ng-content select="[field-action]" />
    </div>
    <ng-content />
    @if (error()) {
      <p [id]="inputId() + '-error'" class="field-error mt-2 text-[13px]" role="alert">{{ error() }}</p>
    } @else if (hint()) {
      <p [id]="inputId() + '-hint'" class="field-hint mt-2 text-xs">{{ hint() }}</p>
    }
  `,
  styles: `
    :host { display: block; }
    .field-error { color: var(--auth-danger, var(--color-danger)); animation: field-error-in 220ms var(--ease-out) both; }
    @keyframes field-error-in { from { opacity: 0; transform: translateY(-4px); } }
    @media (prefers-reduced-motion: reduce) { .field-error { animation: none; } }
    .field-hint { color: var(--auth-muted, var(--color-muted)); }
  `
})
export class FormFieldComponent {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly error = input('');
  readonly hint = input('');
}
